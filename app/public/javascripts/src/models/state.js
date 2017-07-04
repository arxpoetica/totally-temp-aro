/* global app localStorage map */
app.service('state', ['$rootScope', '$http', 'map_layers', 'configuration', 'regions', 'optimization', 'stateSerializationHelper', ($rootScope, $http, map_layers, configuration, regions, optimization, stateSerializationHelper) => {

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
    fiberSourceIds: [],
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

  // Initialize the state of the application (the parts that depend upon configuration being loaded from the server)
  var initializeState = function () {

    service.planId = service.INVALID_PLAN_ID    // The plan ID that is currently selected

    // A list of location types to show in the locations layer
    service.locationTypesV1 = []
    service.locationTypes = []

    service.allDataSources = service.defaultDataSources.slice()

    // A list of location data sources to show in the locations layer
    service.selectedDataSources = service.defaultDataSources.slice()

    if (configuration && configuration.locationCategories && configuration.locationCategories.v2) {
      var locations = configuration.locationCategories.v2
      Object.keys(locations).forEach((locationKey) => {
        var location = locations[locationKey]
        location.key = locationKey
        location.checked = true
        service.locationTypes.push(location)
      })
    }

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

    //create construction sites copy locationTypes and then add a isConstructionSite Field
    service.constructionSites = angular.copy(service.locationTypes);
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
