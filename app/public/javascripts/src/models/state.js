/* global app localStorage map */
app.service('state', ['$rootScope', '$http', '$document', 'map_layers', 'configuration', 'regions', 'optimization', 'stateSerializationHelper', ($rootScope, $http, $document, map_layers, configuration, regions, optimization, stateSerializationHelper) => {

  // Important: RxJS must have been included using browserify before this point
  var Rx = require('rxjs')

  var key = null
  var state = null
  var service = {}
  service.INVALID_PLAN_ID = -1
  service.DS_GLOBAL_BUSINESSES = -3
  service.DS_GLOBAL_HOUSEHOLDS = -2
  service.DS_GLOBAL_CELLTOWER = -1

  service.OPTIMIZATION_TYPES = {
    UNCONSTRAINED: { id: 'UNCONSTRAINED', algorithm: 'UNCONSTRAINED', label: 'Full Coverage' },
    MAX_IRR: { id: 'MAX_IRR', algorithm: 'IRR', label: 'Maximum IRR' },
    BUDGET: { id: 'BUDGET', algorithm: 'IRR', label: 'Budget' },
    IRR_TARGET: { id: 'IRR_TARGET', algorithm: 'IRR', label: 'IRR Target' },
    IRR_THRESH: { id: 'IRR_THRESH', algorithm: 'IRR', label: 'IRR Threshold' },
    TABC: { id: 'TABC', algorithm: 'CUSTOM', label: 'ABCD analysis' },  // Verizon-specific
    COVERAGE: { id: 'COVERAGE', algorithm: 'COVERAGE', label: 'Coverage Target' }
  }
  
  service.viewFiberOptions = [
    {
      id: 1,
      name: "Uniform width"
    },
    {
      id: 2,
      name: "Fiber Strand Count",
      field: "fiber_strands",
      multiplier: 2.1,
      pixelWidth: {
        min: 2,
        max: 12,
        divisor: 1 / 3
      },
      opacity: {
        min: 0.66,
        max: 1
      }
    },
    {
      id: 3,
      name: "Atomic Unit Demand",
      field: "atomic_units",
      multiplier: 1,
      pixelWidth: {
        min: 2,
        max: 12,
        divisor: 1 / 3,
        atomicDivisor: 50
      },
      opacity: {
        min: 0.66,
        max: 1
      }
    }
  ]

  ;['dragend', 'zoom_changed'].forEach((event_name) => {
    $rootScope.$on('map_' + event_name, () => {
      if (!key) return

      var center = map.getCenter()
      if (!center) return
      var literal = { lat: center.lat(), lng: center.lng() }
      service.set('mapCenter', JSON.stringify(literal))
      service.set('mapZoom', map.getZoom())
    })
  })

  // Promises for app initialization (configuration loaded, map ready, etc.)
  var configurationLoadedPromise = new Promise((resolve, reject) => {
    $rootScope.$on('configuration_loaded', (event, data) => resolve())
  })
  var mapReadyPromise = new Promise((resolve, reject) => {
    $document.ready(() => {
      // At this point we will have access to the global map variable
      map.ready(() => resolve())
    })
  })
  // appReadyPromise will resolve when the map and configuration are loaded
  service.appReadyPromise = Promise.all([configurationLoadedPromise, mapReadyPromise])

  // Optimization options - initialize once
  service.optimizationOptions = {
    uiAlgorithms: [],
    uiSelectedAlgorithm: null,
    fiberNetworkConstraints: {
      routingMode: 'DIRECT_ROUTING',
      cellNodeConstraints: {
        cellRadius: 300.0,
        polygonStrategy: 'FIXED_RADIUS',
        tiles: [],
        selectedTile: null
      }
    },
    processLayers: [],
    financialConstraints: {
      years: 10,
      budget: 10000000,
      preIrrThreshold: 0.1 // This will be converted to a precentage when sending to the UI
    },
    threshold: 0, // This will be converted to a precentage when sending to the UI
    customOptimization: null,
    routeGenerationOptions: [
      { id: 'T', value: 'A Route', checked: false },
      { id: 'A', value: 'B Route', checked: false },
      { id: 'B', value: 'C Route', checked: false },
      { id: 'C', value: 'D Route', checked: false }
    ],
    technologies: [
      { id: 'Fiber', label: 'Fiber', checked: true},
      { id: 'FiveG', label: '5G', checked: false}
    ],
    selectedLayer: null,
    generatedDataRequest: {
      generatePlanLocationLinks : false
    }
  }

  // Map layers data - define once
  service.mapLayers = new Rx.BehaviorSubject({})
  service.showMapTileExtents = new Rx.BehaviorSubject(false)

  service.mapLayers
    .pairwise()
    .subscribe((newValue) => console.log(newValue))

  service.hackRaiseEvent = (feature) => {
    $rootScope.$broadcast('map_layer_clicked_feature', feature, {})
  }

  // Sets (or adds) a map layer with the given key
  service.setMapLayer = (layerKey, data) => {
    // Get a copy of the current maplayers. A little Redux-ey
    var newMapLayers = angular.copy(service.mapLayers.getValue(), {})
    // Set the mapLayer (can be a new layer)
    newMapLayers[layerKey] = data
    service.mapLayers.next(newMapLayers)
  }

  // Boundaries layer data - define once
  service.boundaries = {
    areaLayers: []
  }
  
  // View Settings layer - define once
  service.viewSetting = {
    selectedFiberOption: null
  }

  // Default data sources - define once
  service.defaultDataSources = [
    {
      dataSourceId: service.DS_GLOBAL_BUSINESSES,
      name: "Global Businesses"
    },
    {
      dataSourceId: service.DS_GLOBAL_HOUSEHOLDS,
      name: "Global Households"
    },
    {
      dataSourceId: service.DS_GLOBAL_CELLTOWER,
      name: "Global CellTower"
    }
  ]

  service.locationTypes = new Rx.BehaviorSubject([])
  service.constructionSites = new Rx.BehaviorSubject([])

  // Initialize the state of the application (the parts that depend upon configuration being loaded from the server)
  var initializeState = function () {

    service.planId = service.INVALID_PLAN_ID    // The plan ID that is currently selected

    // A list of location types to show in the locations layer
    service.locationTypesV1 = []
    service.allDataSources = service.defaultDataSources.slice()

    // A list of location data sources to show in the locations layer
    service.selectedDataSources = service.defaultDataSources.slice()

    var locationTypes = []
    if (configuration && configuration.locationCategories && configuration.locationCategories.v2) {
      var locations = configuration.locationCategories.v2
      Object.keys(locations).forEach((locationKey) => {
        var location = locations[locationKey]
        location.key = locationKey
        location.checked = false
        locationTypes.push(location)
      })
    }
    service.locationTypes.next(locationTypes)
    service.constructionSites.next(angular.copy(locationTypes))

    // ****************** START old (V1) location Types implementation
    // Iterate over the business segments in the configuration
    if (configuration && configuration.locationCategories && configuration.locationCategories.business && configuration.locationCategories.business.segments) {
      Object.keys(configuration.locationCategories.business.segments).forEach((key) => {
        var segment = configuration.locationCategories.business.segments[key];
        if (segment.show) {
          service.locationTypesV1.push({type: 'business', key: key, label: segment.label, checked: false, icon: configuration.locationCategories.mapIconFolder + 'businesses_' + key + '_default.png'
          })
        }
      })
    }

    // Show residential/household units
    if (configuration && configuration.locationCategories && configuration.locationCategories.household) {
      if (configuration.locationCategories.household.show) {
        service.locationTypesV1.push({ type: 'household',
          key: 'household',
          label: configuration.locationCategories.household.label,
          checked: false,
          icon: configuration.locationCategories.mapIconFolder + 'households_default.png'
        })
      }
    }

    // Show Towers
    if (configuration && configuration.locationCategories && configuration.locationCategories.celltower) {
      if (configuration.locationCategories.celltower.show) {
        service.locationTypesV1.push({
          type: 'celltower',
          key: 'celltower',
          label: configuration.locationCategories.celltower.label,
          checked: false,
          icon: configuration.locationCategories.mapIconFolder + 'tower.png'
        })
      }
    }
    // ****************** END old (V1) location Types implementation

    // Network equipment layer
    service.networkEquipments = []
    service.existingFiberOptions = {}
    if (configuration && configuration.networkEquipment) {
      service.existingFiberOptions = configuration.networkEquipment.existingFiberOptions
      if (configuration.networkEquipment.equipmentList) {
        Object.keys(configuration.networkEquipment.equipmentList).forEach((categoryKey) => {
          // First save the label for the category
          var category = configuration.networkEquipment.equipmentList[categoryKey]
          var categoryStateObj = {
            key: categoryKey,
            label: category.label,
            layers: []
          }
          // Then save all the network layers in the category
          Object.keys(category.layers).forEach((layerKey) => {
            var networkEquipment = category.layers[layerKey]
            networkEquipment.key = layerKey
            networkEquipment.checked = false
            categoryStateObj.layers.push(networkEquipment)
          })
          service.networkEquipments.push(categoryStateObj)
        })
      }
    }
  }

  // Load tile information from the server
  $http({
	 url: '/morphology/tiles',
	 method: 'GET'
	})
	.then((response) => {
	  service.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints.tiles = response.data
    service.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints.selectedTile 
      = (service.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints.tiles.length > 0)
        ? service.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints.tiles[0]
        : null
	})

  // Load existing fibers list from the server
  service.allExistingFibers = []
  service.selectedExistingFibers = []
  service.loadExistingFibersList = () => {
    service.selectedExistingFibers = [] // Dont want to hold on to any earlier objects
    return new Promise((resolve, reject) => {
      $http.get('/user_fiber/list')
        .then((response) => {
          if (response.status >= 200 && response.status <= 299) {
            service.allExistingFibers = response.data
            resolve()
          } else {
            reject(response)
          }
        })
    })
  }
  service.loadExistingFibersList()

  initializeState()

  // When configuration is loaded from the server, update it in the state
  $rootScope.$on('configuration_loaded', () => {
    initializeState()
  })

  // Reload uploaded data sources
  service.reloadDatasources = (callback) => {
    $http.get('/datasources').then((response) => {
      service.allDataSources = service.defaultDataSources.slice()
      service.selectedDataSources = service.defaultDataSources.slice()   // Always keep the global data sources selected
      service.allDataSources = service.allDataSources.concat(response.data)
      callback && callback(response.data)
    })
  }

  // Get a POST body that we will send to aro-service for performing optimization
  service.getOptimizationBody = () => {
    return stateSerializationHelper.getOptimizationBody(service, optimization, regions)
  }

  // Load optimization options from a JSON string
  service.loadOptimizationOptionsFromJSON = (json) => {
    // Note that we are NOT returning the state (the state is set after the call), but a promise
    // that resolves once all the geographies have been loaded
    return stateSerializationHelper.loadStateFromJSON(service, optimization, regions, json)
  }

  service.clearPlan = (plan) => {
    key = null
    //dont clear the existing state here
    //initializeState()
    localStorage.removeItem(`plan_${plan.id}`)
  }

  service.loadPlan = (plan) => {
    service.planId = +plan.id
    if (!plan) {
      key = null
      initializeState()
    } else {
      key = `plan_${plan.id}`
      try {
        state = JSON.parse(localStorage.getItem(key)) || {}
      } catch (err) {
        state = {}
      }
    }
  }

  service.set = (attr, value) => {
    if (state.planId === service.INVALID_PLAN_ID) return
    state[attr] = value
    localStorage.setItem(key, JSON.stringify(state))
  }

  service.get = (attr, value, def) => {
    if (state.planId === service.INVALID_PLAN_ID) return def
    return state[attr] || def
  }

  service.isDataSourceSelected = function (ds) {
    var existingDataSources = _.pluck(service.selectedDataSources , 'dataSourceId');
    return existingDataSources.indexOf(ds) != -1;
  }

  return service
}])
