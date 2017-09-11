/* global app localStorage map */
app.service('state', ['$rootScope', '$http', '$document', 'map_layers', 'configuration', 'regions', 'optimization', 'stateSerializationHelper', '$filter', ($rootScope, $http, $document, map_layers, configuration, regions, optimization, stateSerializationHelper, $filter) => {

  // Important: RxJS must have been included using browserify before this point
  var Rx = require('rxjs')

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

  service.GEOGRAPHY_LAYERS = {
    SERVICE_AREAS: { id: 'SELECTED_AREAS', label: 'Service Areas' },
    LOCATIONS: { id: 'SELECTED_LOCATIONS', label: 'Locations' }
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
    networkConstraints: {
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
      cashFlowStrategyType: 'EXTERNAL',
      discountRate: 0.06,
      years: 15
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
    selectedTechnology: null,
    selectedLayer: null,
    generatedDataRequest: {
      generatePlanLocationLinks : false
    },
    geographicalLayers: [],
    selectedgeographicalLayer: null
  }

  // View Settings layer - define once
  service.viewSetting = {
    selectedFiberOption: null,
    heatmapOptions: [
      {
        id: 'HEATMAP_ON',
        label: 'Aggregate heatmap'
      },
      {
        id: 'HEATMAP_DEBUG',
        label: 'Aggregate points'
      },
      {
        id: 'HEATMAP_OFF',
        label: 'Raw Points'
      }
    ]
  }

  // Map layers data - define once. Details on map layer objects are available in the TileComponentController class in tile-component.js
  service.mapLayers = new Rx.BehaviorSubject({})
  service.mapTileOptions = new Rx.BehaviorSubject({
    showTileExtents: false,
    heatMap: {
      useAbsoluteMax: true,
      maxValue: 100,
      powerExponent: 0.5,
      worldMaxValue: 100000000
    },
    selectedHeatmapOption: service.viewSetting.heatmapOptions[0]
  })
  service.requestMapLayerRefresh = new Rx.BehaviorSubject({})
  service.showGlobalSettings = new Rx.BehaviorSubject(false)
  service.showNetworkAnalysisOutput = new Rx.BehaviorSubject(false)
  service.networkPlanModal =  new Rx.BehaviorSubject(false)
  
  service.hackRaiseEvent = (features) => {
    $rootScope.$broadcast('map_layer_clicked_feature', features, {})
  }
  service.mapFeaturesSelectedEvent = new Rx.BehaviorSubject({})

  // Raise an event requesting locations within a polygon to be selected. Coordinates are relative to the visible map.
  service.requestPolygonSelect = new Rx.BehaviorSubject({})

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
    tileLayers: [],
    areaLayers: []
  }

  // Default data sources - define once
  service.defaultDataSources = [
    {
      libraryId: service.DS_GLOBAL_BUSINESSES,
      name: "Global Businesses"
    },
    {
      libraryId: service.DS_GLOBAL_HOUSEHOLDS,
      name: "Global Households"
    },
    {
      libraryId: service.DS_GLOBAL_CELLTOWER,
      name: "Global CellTower"
    }
  ]

  // The display modes for the application
  service.displayModes = Object.freeze({
    VIEW: 0,
    ANALYSIS: 1,
    PLAN_SETTINGS: 2
  })
  service.selectedDisplayMode = new Rx.BehaviorSubject(service.displayModes.VIEW)

  // The selection modes for the application
  service.selectionModes = Object.freeze({
    SINGLE_ENTITY: 0,
    POLYGON: 1
  })
  service.activeSelectionMode = new Rx.BehaviorSubject(service.selectionModes.SINGLE_ENTITY)

  // Competition display
  service.competition = {
    allCompetitorTypes: [
      {
        id: 'retail',
        label: 'Retail'
      },
      {
        id: 'wholesale',
        label: 'Wholesale'
      },
      {
        id: 'tower',
        label: 'Cell Towers'
      }
    ],
    selectedCompetitorType: null,
    allCompetitors: [],
    selectedCompetitors: [],
    useAllCompetitors: false,
    useNBMDataSource: true,
    useGeotelDataSource: false,
    speedThreshold: 100,
    showCensusBlocks: true,
    showFiberRoutes: false,
    showFiberRoutesBuffer: false,
    allRenderingOptions: [
      {
        label: 'Presence',
        alphaRender: false
      },
      {
        label: 'Competitive Strength',
        aggregate: {
          individual: {
            'census-block': {
              aggregateById: 'gid',
              aggregateProperty: 'strength'
            },
            'census-block-group': {
              aggregateById: 'cbg_id',
              aggregateProperty: 'strength'
            }
          },
          all: {
            'census-block': {
              aggregateById: 'gid',
              aggregateProperty: 'sum_strength'
            },
            'census-block-group': {
              aggregateById: 'cbg_id',
              aggregateProperty: 'sum_strength'
            }
          }
        }
      },
      {
        label: 'Speed Intensity',
        alphaRender: true,
        alphaThresholdProperty: 'download_speed',
        aggregate: {
          individual: {
            'census-block': {
              aggregateById: 'gid',
              aggregateProperty: 'download_speed'
            },
            'census-block-group': {
              aggregateById: 'cbg_id',
              aggregateProperty: 'download_speed'
            }
          },
          all: {
            'census-block': {
              aggregateById: 'gid',
              aggregateProperty: 'max_download'
            },
            'census-block-group': {
              aggregateById: 'cbg_id',
              aggregateProperty: 'max_download'
            }
          }
        }
      }
    ],
    selectedRenderingOption: null
  }

  // Function to convert from hsv to rgb color values.
  // https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
  var hsvToRgb = (h, s, v) => {
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    var rgb = [r, g, b]
    var color = '#'
    rgb.forEach((colorValue) => {
      var colorValueHex = Math.round(colorValue * 255).toString(16)
      if (colorValueHex.length === 1) {
        colorValueHex = '0' + colorValueHex
      }
      color += colorValueHex
    })
    return color
  }

  // We are going to use the golden ratio method from http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
  // (Furthermore, it is a property of the golden ratio, Φ, that each subsequent hash value divides the interval into which it falls according to the golden ratio!)
  var golden_ratio_conjugate = 0.618033988749895
  var hue = Math.random()
  var getRandomColors = () => {
    hue += golden_ratio_conjugate
    hue %= 1
    // We are changing the hue while keeping saturation/value the same. Also the fill colors are lighter than stroke colors.
    return {
      strokeStyle: hsvToRgb(hue, 0.5, 0.5),
      fillStyle: hsvToRgb(hue, 0.8, 0.5)
    }
  }

  // Select the first entry in the list
  service.competition.selectedCompetitorType = service.competition.allCompetitorTypes[0]
  service.competition.selectedRenderingOption = service.competition.allRenderingOptions[0]
  service.reloadCompetitors = () => {
    if (map) {
      var bounds = map.getBounds()
      var params = {
    	maxY: bounds.getNorthEast().lat(),
    	maxX: bounds.getNorthEast().lng(),
        minY: bounds.getSouthWest().lat(),
        minX: bounds.getSouthWest().lng()
      }
    }
    var temp = map != null ? params : {}
    var args = {
      params: temp,
    };
    return $http.get(`/competitors/v1/competitors/carriers/${service.competition.selectedCompetitorType.id}`, args)
      .then((response) => {
        if (response.status >= 200 && response.status <= 299) {
          service.competition.allCompetitors = $filter('orderBy')(response.data,'name')
          // For now just populate random colors for each competitor. This can later come from the api.
          for (var iCompetitor = 0; iCompetitor < service.competition.allCompetitors.length; ++iCompetitor) {
            var randomColors = getRandomColors()
            service.competition.allCompetitors[iCompetitor].strokeStyle = randomColors.strokeStyle
            service.competition.allCompetitors[iCompetitor].fillStyle = randomColors.fillStyle
          }
        }
      })
  }
  //service.reloadCompetitors()

  service.locationTypes = new Rx.BehaviorSubject([])
  service.constructionSites = new Rx.BehaviorSubject([])

  // Hold a map of selected locations
  service.selectedLocationIcon = '/images/map_icons/aro/target.png'
  service.selectedLocations = new Rx.BehaviorSubject(new Set())
  service.reloadSelectedLocations = () => {
    var plan = service.plan.getValue()
    if (plan) {
      $http.get(`/locations/${plan.id}/selectedLocationIds`)
        .then((result) => {
          if (result.status >= 200 && result.status <= 299) {
            var selectedLocationsSet = new Set()
            result.data.forEach((selectedLocationId) => selectedLocationsSet.add(+selectedLocationId.location_id))
            service.selectedLocations.next(selectedLocationsSet)
            service.requestMapLayerRefresh.next({})
          }
        })
    }
  }

  // Plan - define once
  service.plan = new Rx.BehaviorSubject(null)

  // Initialize the state of the application (the parts that depend upon configuration being loaded from the server)
  var initializeState = function () {
    
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

    service.selectedDisplayMode.next(service.displayModes.VIEW)
    service.activeSelectionMode.next(service.selectionModes.SINGLE_ENTITY)

    service.networkAnalysisTypes = [
      { id: 'NETWORK_BUILD', label: 'Network Build', type: "NETWORK_PLAN" },
      { id: 'NETWORK_ANALYSIS', label: 'Network Analysis', type: "NETWORK_ANALYSIS" },
      { id: 'Coverage_ANALYSIS', label: 'Coverage Analysis', type: "COVERAGE" },
      { id: 'NEARNET_ANALYSIS', label: 'Near-net Analysis', type: "UNDEFINED" }
    ]
    service.networkAnalysisType = service.networkAnalysisTypes[0]

  }

  // Load tile information from the server
  $http({
	 url: '/morphology/tiles',
	 method: 'GET'
	})
	.then((response) => {
	  service.optimizationOptions.networkConstraints.cellNodeConstraints.tiles = response.data
    service.optimizationOptions.networkConstraints.cellNodeConstraints.selectedTile
      = (service.optimizationOptions.networkConstraints.cellNodeConstraints.tiles.length > 0)
        ? service.optimizationOptions.networkConstraints.cellNodeConstraints.tiles[0]
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

  service.defaultPlanCoordinates = {
    zoom: 14,
    latitude: 47.6062,      // Seattle, WA by default. For no particular reason.
    longitude: -122.3321    // Seattle, WA by default. For no particular reason.
  }
  $document.ready(() => {
    // We should have a map object at this point. Unfortunately, this is hardcoded for now.
    if (map) {
      map.addListener('center_changed', () => {
        var center = map.getCenter()
        service.defaultPlanCoordinates.latitude = center.lat()
        service.defaultPlanCoordinates.longitude = center.lng()
      })
      map.addListener('zoom_changed', () => {
        service.defaultPlanCoordinates.zoom = map.getZoom()
      })
    } else {
      console.warn('Map object not found. Plan coordinates and zoom will not be updated when the user pans or zooms the map')
    }
  })

  service.getAddressFor = (latitude, longitude) => {
    return new Promise((resolve, reject) => {
      var geocoder = new google.maps.Geocoder
      var address = ''
      geocoder.geocode({ 'location': new google.maps.LatLng(latitude, longitude) }, function (results, status) {
        if (status === 'OK') {
          if (results[1]) {
            address = results[0].formatted_address
          } else {
            console.warn(`No address results for coordinates ${latitude}, ${longitude}`)
          }
        } else {
          console.warn(`Unable to get address for coordinates ${latitude}, ${longitude}`)
        }
        resolve(address)  // Always resolve, even if reverse geocoding failed
      })
    })
  }

  service.createEphemeralPlan = () => {
    // Use reverse geocoding to get the address at the current center of the map
    var planOptions = {
      projectId: globalUser.projectId, // Ugh. Depending on global variable "globalUser"
      areaName: '',
      latitude: service.defaultPlanCoordinates.latitude,
      longitude: service.defaultPlanCoordinates.longitude,
      zoomIndex: service.defaultPlanCoordinates.zoom,
      ephemeral: true
    }
    service.getAddressFor(planOptions.latitude, planOptions.longitude)
      .then((address) => {
        planOptions.areaName = address
        var apiEndpoint = `/service/v1/plan?user_id=${globalUser.id}` // Ugh. Depending on global variable "globalUser"
        $http.post(apiEndpoint, planOptions)
          .then((result) => {
            if (result.status >= 200 && result.status <= 299) {
              service.plan.next(result.data)
              initializeState()
              service.reloadSelectedLocations()
            } else {
              console.error(result)
            }
          })
          .catch((err) => console.error(err))
      })
  }
  service.createEphemeralPlan() // Will be called once when the page loads, since state.js is a service

  service.makeCurrentPlanNonEphemeral = (planName) => {
    var newPlan = JSON.parse(JSON.stringify(service.plan.getValue()))
    newPlan.name = planName
    newPlan.ephemeral = false
    newPlan.latitude = service.defaultPlanCoordinates.latitude
    newPlan.longitude = service.defaultPlanCoordinates.longitude
    service.getAddressFor(newPlan.latitude, newPlan.longitude)
      .then((address) => {
        newPlan.areaName = address
        $http.put(`/service/v1/plan?user_id=${globalUser.id}`, newPlan)
          .then((result) => {
            if (result.status >= 200 && result.status <= 299) {
              // Plan has been saved in the DB. Reload it
              service.loadPlan(result.data.id)
            } else {
              console.error('Unable to make plan permanent')
              console.error(result)
            }
          })
      })
  }

  service.copyCurrentPlanTo = (planName) => {
    var newPlan = JSON.parse(JSON.stringify(service.plan.getValue()))
    newPlan.name = planName
    newPlan.ephemeral = false
    $http.post(`/service/v1/plan?user_id=${globalUser.id}&source_plan_id=${newPlan.id}`, newPlan)
      .then((result) => {
        if (result.status >= 200 && result.status <= 299) {
          service.loadPlan(result.data.id)
        } else {
          console.error('Unable to copy plan')
          console.error(result)
        }
      })
  }

  service.loadPlan = (plan) => {
    $http.get(`/service/v1/plan/${plan.id}?user_id=${globalUser.id}`)
      .then((result) => {
        if (result.status >= 200 && result.status <= 299) {
          service.plan.next(result.data)
        }
      })
  }

  service.isDataSourceSelected = function (ds) {
    var existingDataSources = _.pluck(service.selectedDataSources , 'libraryId');
    return existingDataSources.indexOf(ds) != -1;
  }

  return service
}])
