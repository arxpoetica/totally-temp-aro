/* global app localStorage map */
app.service('state', ['$rootScope', '$http', '$document', '$timeout', 'map_layers', 'configuration', 'optimization', 'stateSerializationHelper', '$filter','tileDataService', ($rootScope, $http, $document, $timeout, map_layers, configuration, optimization, stateSerializationHelper, $filter, tileDataService) => {

  // Important: RxJS must have been included using browserify before this point
  var Rx = require('rxjs')

  var state = null
  var service = {}
  service.INVALID_PLAN_ID = -1

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

  // The selection modes for the application
  service.selectionModes = {
    SELECTED_AREAS: 'Service Areas',
    SELECTED_LOCATIONS: 'Locations'
  }

  // The selected panel when in the View mode
  service.viewModePanels = Object.freeze({
    LOCATION_INFO: 'LOCATION_INFO',
    EQUIPMENT_INFO: 'EQUIPMENT_INFO',
    BOUNDARIES_INFO: 'BOUNDARIES_INFO',
    ROAD_SEGMENT_INFO: 'ROAD_SEGMENT_INFO',
    COVERAGE_BOUNDARY: 'COVERAGE_BOUNDARY',
    EDIT_LOCATIONS: 'EDIT_LOCATIONS',
    PLAN_INFO: 'PLAN_INFO'
  })
  service.activeViewModePanel = service.viewModePanels.LOCATION_INFO

  service.routingModes = {
    DIRECT_ROUTING: 'Direct Routing',
    ODN_1: 'Hub-only split',
    ODN_2: 'Hub-distribution split'
  }

  // Optimization options - initialize once
  service.optimizationOptions = {
    uiAlgorithms: [],
    uiSelectedAlgorithm: null,
    networkConstraints: {
      routingMode: 'DIRECT_ROUTING',
      cellNodeConstraints: {
        cellRadius: 300.0,
        cellGranularityRatio: 0.5,
        minimumRayLength: 45,
        polygonStrategy: 'FIXED_RADIUS',
        tiles: [],
        selectedTile: null
      }
    },
    financialConstraints: {
      cashFlowStrategyType: 'EXTERNAL',
      discountRate: 0.06,
      years: 15
    },
    threshold: 0, // This will be converted to a precentage when sending to the UI
    preIrrThreshold: 1.0,
    budget: 100000,
    customOptimization: null,
    routeGenerationOptions: [
      { id: 'T', value: 'A Route', checked: false },
      { id: 'A', value: 'B Route', checked: false },
      { id: 'B', value: 'C Route', checked: false },
      { id: 'C', value: 'D Route', checked: false }
    ],
    technologies: { // Note that the keys are passed in to the optimization endpoint, so don't change them
      Fiber: {
        label: 'Fiber',
        checked: true
      },
      FiveG: {
        label: '5G',
        checked: false
      }
    },
    selectedLayer: null,
    generatedDataRequest: {
      generatePlanLocationLinks : false
    },
    analysisSelectionMode: service.selectionModes.SELECTED_AREAS
  }

  //set default values for uiSelectedAlgorithm & selectedgeographicalLayer
  service.optimizationOptions.uiAlgorithms = [
    service.OPTIMIZATION_TYPES.UNCONSTRAINED,
    service.OPTIMIZATION_TYPES.MAX_IRR,
    service.OPTIMIZATION_TYPES.BUDGET,
    service.OPTIMIZATION_TYPES.IRR_TARGET,
    service.OPTIMIZATION_TYPES.IRR_THRESH,
    service.OPTIMIZATION_TYPES.COVERAGE
  ]

  service.optimizationOptions.uiSelectedAlgorithm = service.optimizationOptions.uiAlgorithms[0]

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

  // The panels in the view mode

  // Map layers data - define once. Details on map layer objects are available in the TileComponentController class in tile-component.js
  service.mapLayers = new Rx.BehaviorSubject({})
  service.mapTileOptions = new Rx.BehaviorSubject({
    showTileExtents: false,
    heatMap: {
      useAbsoluteMax: false,
      maxValue: 100,
      powerExponent: 0.5,
      worldMaxValue: 500000
    },
    selectedHeatmapOption: service.viewSetting.heatmapOptions[0]
  })
  service.defaultPlanCoordinates = {
    zoom: 14,
    latitude: 47.6062,      // Seattle, WA by default. For no particular reason.
    longitude: -122.3321    // Seattle, WA by default. For no particular reason.
  }
  service.requestMapLayerRefresh = new Rx.BehaviorSubject({})
  service.requestRecreateTiles = new Rx.BehaviorSubject({})
  service.showGlobalSettings = new Rx.BehaviorSubject(false)
  service.showNetworkAnalysisOutput = false
  service.networkPlanModal =  new Rx.BehaviorSubject(false)
  service.planInputsModal =  new Rx.BehaviorSubject(false)
  service.reportModal =  new Rx.BehaviorSubject(false)
  service.splitterObj = new Rx.BehaviorSubject({})
  service.requestSetMapCenter = new Rx.BehaviorSubject({ latitude: service.defaultPlanCoordinates.latitude, longitude: service.defaultPlanCoordinates.longitude })
  service.requestSetMapZoom = new Rx.BehaviorSubject(service.defaultPlanCoordinates.zoom)
  service.showDetailedLocationInfo = new Rx.BehaviorSubject()  
  service.showDetailedEquipmentInfo = new Rx.BehaviorSubject()    
  service.showDataSourceUploadModal = new Rx.BehaviorSubject(false)
  service.dataItemsChanged = new Rx.BehaviorSubject({})
  service.viewSettingsChanged = new Rx.BehaviorSubject()
  service.selectionTypeChanged = new Rx.BehaviorSubject()
  service.measuredDistance = new Rx.BehaviorSubject()
  service.showPlanResourceEditorModal = false
  service.editingPlanResourceKey = null
  service.isLoadingPlan = false
  service.expertModeBody = null
  //This modal will be used to toogle from report modal to current modal 
  service.previousModal

  service.selectionTypeChanged.next(service.selectionModes.SELECTED_AREAS)

  service.hackRaiseEvent = (features) => {
    $rootScope.$broadcast('map_layer_clicked_feature', features, {})
  }
  service.mapFeaturesSelectedEvent = new Rx.BehaviorSubject({})

  // Raise an event requesting locations within a polygon to be selected. Coordinates are relative to the visible map.
  service.requestPolygonSelect = new Rx.BehaviorSubject({})

  // Boundaries layer data - define once
  service.boundaries = {
    tileLayers: [],
    areaLayers: []
  }

  // The display modes for the application
  service.displayModes = Object.freeze({
    VIEW: 'VIEW',
    ANALYSIS: 'ANALYSIS',
    EDIT_PLAN: 'EDIT_PLAN',
    PLAN_SETTINGS: 'PLAN_SETTINGS',
    DEBUG: 'DEBUG'
  })
  service.selectedDisplayMode = new Rx.BehaviorSubject(service.displayModes.VIEW)
  service.targetSelectionModes = Object.freeze({
    SINGLE: 0,
    POLYGON: 1,
    COVERAGE_BOUNDARY: 5
  })
  service.selectedTargetSelectionMode = service.targetSelectionModes.SINGLE

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
      return $http.get(`/locations/${plan.id}/selectedLocationIds`)
        .then((result) => {
          var selectedLocationsSet = new Set()
          result.data.forEach((selectedLocationId) => selectedLocationsSet.add(+selectedLocationId.location_id))
          service.selectedLocations.next(selectedLocationsSet)
          service.requestMapLayerRefresh.next({})
          return Promise.resolve()
        })
    } else {
      return Promise.resolve()
    }
  }

  service.selectedServiceAreas = new Rx.BehaviorSubject(new Set())
  service.reloadSelectedServiceAreas = (forceMapRefresh = false) => {
    var plan = service.plan.getValue()
    if (plan) {
      $http.get(`/service_areas/${plan.id}/selectedServiceAreaIds`)
        .then((result) => {
          var selectedSASet = new Set()
          result.data.forEach((service_area) => selectedSASet.add(+service_area.service_area_id))
          service.selectedServiceAreas.next(selectedSASet)
          service.requestMapLayerRefresh.next({})
          if (forceMapRefresh) {
            tileDataService.clearDataCache()
            tileDataService.markHtmlCacheDirty()
          }
          return Promise.resolve()
        })
    } else {
      return Promise.resolve()
    }
  }

  service.selectedRoadSegments = new Rx.BehaviorSubject(new Set())
  service.reloadSelectedRoadSegments = (road) => {
    service.selectedRoadSegments.next(road)
    service.requestMapLayerRefresh.next({})
  }

  // Plan - define once
  service.plan = new Rx.BehaviorSubject(null)

  // Initialize the state of the application (the parts that depend upon configuration being loaded from the server)
  var initializeState = function () {

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
    service.optimizationOptions.analysisSelectionMode = 'SELECTED_AREAS'

    service.networkAnalysisTypes = [
      { id: 'NETWORK_PLAN', label: 'Network Build', type: "NETWORK_PLAN" },
      { id: 'NETWORK_ANALYSIS', label: 'Network Analysis', type: "NETWORK_ANALYSIS" },
      { id: 'Coverage_ANALYSIS', label: 'Coverage Analysis', type: "COVERAGE" },
      { id: 'NEARNET_ANALYSIS', label: 'Near-net Analysis', type: "UNDEFINED" },
      { id: 'EXPERT_MODE', label: 'Expert Mode', type: "Expert" }
    ]
    service.networkAnalysisType = service.networkAnalysisTypes[0]

    //Upload Data Sources
    service.uploadDataSources = [
    ]
    service.uploadDataSource
    service.dataItems = {}

  }

  initializeState()

  // When configuration is loaded from the server, update it in the state
  $rootScope.$on('configuration_loaded', () => {
    initializeState()
  })

  // Get a POST body that we will send to aro-service for performing optimization
  service.getOptimizationBody = () => {
    return stateSerializationHelper.getOptimizationBody(service, optimization)
  }

  // Load optimization options from a JSON string
  service.loadOptimizationOptionsFromJSON = (json) => {
    //return Promise.reject('loadOptimizationOptionsFromJSON() no longer supported in the new UI')
    // // Note that we are NOT returning the state (the state is set after the call), but a promise
    // // that resolves once all the geographies have been loaded
    // return stateSerializationHelper.loadStateFromJSON(service, optimization, regions, json)
    return stateSerializationHelper.loadStateFromJSON(service, optimization, json)
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

  service.getUserId = () => {
    return globalUser.id // Ugh. Depending on global variable "globalUser"
  }

  service.getProjectId = () => {
    return globalUser.projectId // Ugh. Depending on global variable "globalUser"
  }

  service.loadPlanDataSelectionFromServer = () => {

    if(!service.plan) {
      return Promise.resolve()
    }

    var currentPlan = service.plan.getValue()
    var promises = [
      $http.get('/service/odata/datatypeentity'),
      $http.get(`/service/v1/project/${globalUser.projectId}/library?user_id=${globalUser.id}`),
      $http.get(`/service/v1/plan/${currentPlan.id}/configuration?user_id=${globalUser.id}`)
    ]

    return Promise.all(promises)
      .then((results) => {
        // Results will be returned in the same order as the promises array
        var dataTypeEntityResult = results[0].data
        var libraryResult = results[1].data
        var configurationResult = results[2].data

        service.uploadDataSources = []
        dataTypeEntityResult.forEach((dataTypeEntity) => {
          if(dataTypeEntity.uploadSupported) {
            service.uploadDataSources.push({
              id: dataTypeEntity.id,
              label: dataTypeEntity.description,
              name: dataTypeEntity.name
            })
          }
        })
        
        var newDataItems = {}
        dataTypeEntityResult.forEach((dataTypeEntity) => {
          newDataItems[dataTypeEntity.name] = {
            id: dataTypeEntity.id,
            description: dataTypeEntity.description,
            minValue: dataTypeEntity.minValue,
            maxValue: dataTypeEntity.maxValue,
            uploadSupported: dataTypeEntity.uploadSupported,
            isMinValueSelectionValid: true,
            isMaxValueSelectionValid: true,
            selectedLibraryItems: [],
            allLibraryItems: []
          }
        })

        // For each data item, construct the list of all available library items
        Object.keys(newDataItems).forEach((dataItemKey) => {
          // Add the list of all library items for this data type
          libraryResult.forEach((libraryItem) => {
            if (libraryItem.dataType === dataItemKey) {
              newDataItems[dataItemKey].allLibraryItems.push(libraryItem)
            }
          })
        })

        // For each data item, construct the list of selected library items
        configurationResult.configurationItems.forEach((configurationItem) => {
          // For this configuration item, find the data item based on the dataType
          var dataItem = newDataItems[configurationItem.dataType]
          // Find the item from the allLibraryItems based on the library id
          var selectedLibraryItems = configurationItem.libraryItems
          selectedLibraryItems.forEach((selectedLibraryItem) => {
            var matchedLibraryItem = dataItem.allLibraryItems.filter((libraryItem) => libraryItem.identifier === selectedLibraryItem.identifier)
            dataItem.selectedLibraryItems = dataItem.selectedLibraryItems.concat(matchedLibraryItem)  // Technically there will be only one matched item
          })
        })

        service.dataItems = newDataItems
        service.dataItemsChanged.next(service.dataItems)
        return Promise.resolve()
      })
  }

  // Shows the modal for editing plan resources
  service.showPlanResourceEditor = (resourceKey) => {
    service.editingPlanResourceKey = resourceKey
    service.showPlanResourceEditorModal = true
  }

  // Load the plan resource selections from the server
  service.loadPlanResourceSelectionFromServer = () => {

    if (!service.plan) {
      return Promise.resolve()
    }
    var currentPlan = service.plan.getValue()
    return Promise.all([
      $http.get('/service/odata/resourcetypeentity'), // The types of resource managers
      $http.get('/service/odata/resourcemanager?$select=name,id,description,managerType,deleted'), // All resource managers in the system
      $http.get(`/service/v1/plan/${currentPlan.id}/configuration?user_id=${globalUser.id}`)
    ])
    .then((results) => {
      var resourceManagerTypes = results[0].data
      var allResourceManagers = results[1].data
      var selectedResourceManagers = results[2].data.resourceConfigItems

      // First set up the resource items so that we display all types in the UI
      var newResourceItems = {}
      resourceManagerTypes.forEach((resourceManager) => {
        newResourceItems[resourceManager.name] = {
          id: resourceManager.id,
          description: resourceManager.description,
          allManagers: [],
          selectedManager: null
        }
      })

      // Then add all the managers in the system to the appropriate type
      allResourceManagers.forEach((resourceManager) => {
        if (!resourceManager.deleted) {
          newResourceItems[resourceManager.managerType].allManagers.push(resourceManager)
        }
      })

      // Then select the appropriate manager for each type
      selectedResourceManagers.forEach((selectedResourceManager) => {
        var allManagers = newResourceItems[selectedResourceManager.aroResourceType].allManagers
        var matchedManagers = allManagers.filter((item) => item.id === selectedResourceManager.resourceManagerId)
        if (matchedManagers.length === 1) {
          newResourceItems[selectedResourceManager.aroResourceType].selectedManager = matchedManagers[0]
        }
      })
      service.resourceItems = newResourceItems
      $timeout()  // Trigger a digest cycle so that components can update
      return Promise.resolve()
    })
  }

  service.loadNetworkConfigurationFromServer = () => {
    $http.get(`/service/v1/project/${globalUser.projectId}/network_configuration?user_id=${globalUser.id}`)
    .then((result) => {
      service.networkConfigurations = {}
      result.data.forEach((networkConfiguration) => {
        service.networkConfigurations[networkConfiguration.routingMode] = networkConfiguration
      })
      service.pristineNetworkConfigurations = angular.copy(service.networkConfigurations)
    })
    .catch((err) => console.log(err))
  }

  // Saves the plan Data Selection configuration to the server
  service.saveDataSelectionToServer = () => {

    var putBody = {
      configurationItems: [],
      resourceConfigItems: []
    }

    Object.keys(service.dataItems).forEach((dataItemKey) => {
      // An example of dataItemKey is 'location'
      if (service.dataItems[dataItemKey].selectedLibraryItems.length > 0) {
        var configurationItem = {
          dataType: dataItemKey,
          libraryItems: service.dataItems[dataItemKey].selectedLibraryItems
        }
        putBody.configurationItems.push(configurationItem)
      }
    })

    var currentPlan = service.plan.getValue()
    // Save the configuration to the server
    $http.put(`/service/v1/plan/${currentPlan.id}/configuration?user_id=${globalUser.id}`, putBody)
  }

  // Save the plan resource selections to the server
  service.savePlanResourceSelectionToServer = () => {
    var putBody = {
      configurationItems: [],
      resourceConfigItems: []
    }

    Object.keys(service.resourceItems).forEach((resourceItemKey) => {
      var selectedManager = service.resourceItems[resourceItemKey].selectedManager
      if (selectedManager) {
        // We have a selected manager
        putBody.resourceConfigItems.push({
          aroResourceType: resourceItemKey,
          resourceManagerId: selectedManager.id,
          name: selectedManager.name,
          description: selectedManager.description
        })
      }
    })

    // Save the configuration to the server
    var currentPlan = service.plan.getValue()
    $http.put(`/service/v1/plan/${currentPlan.id}/configuration?user_id=${globalUser.id}`, putBody)
  }

  // Save the Network Configurations to the server
  service.saveNetworkConfigurationToServer = () => {
    var configSavePromises = []
    Object.keys(service.networkConfigurations).forEach((networkConfigurationKey) => {
      // Only add the network configurations that have changed (e.g. DIRECT_ROUTING)
      if (!angular.equals(service.networkConfigurations[networkConfigurationKey], service.pristineNetworkConfigurations[networkConfigurationKey])) {
        var url = `/service/v1/project/${globalUser.projectId}/network_configuration/${networkConfigurationKey}?user_id=${globalUser.id}`
        configSavePromises.push($http.put(url, service.networkConfigurations[networkConfigurationKey]))
      }
    })
    Promise.all(configSavePromises)
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
    return service.getAddressFor(planOptions.latitude, planOptions.longitude)
      .then((address) => {
        planOptions.areaName = address
        var userId = service.getUserId()
        var apiEndpoint = `/service/v1/plan?user_id=${userId}` // Ugh. Depending on global variable "globalUser"
        return $http.post(apiEndpoint, planOptions)
      })
      .then((result) => {
        if (result.status >= 200 && result.status <= 299) {
          return Promise.resolve(result.data)
        } else {
          return Promise.reject(result)
        }
      })
  }

  // Gets the last ephemeral plan in use, or creates a new one if no ephemeral plan exists.
  service.getOrCreateEphemeralPlan = () => {
    var userId = service.getUserId()
    return $http.get(`/service/v1/plan/ephemeral/latest?user_id=${userId}`)
      .then((result) => {
        if (result.status >= 200 && result.status <= 299) {
          // We have a valid ephemeral plan if we get back an object with *some* properties
          var isValidEphemeralPlan = Object.getOwnPropertyNames(result.data).length > 0
          if (isValidEphemeralPlan) {
            // We have a valid ephemeral plan. Return it.
            return Promise.resolve(result.data)
          } else {
            // We dont have an ephemeral plan. Create one and send it back
            return service.createEphemeralPlan()
          }
        } else {
          return Promise.reject(result)
        }
      })
  }
  service.getOrCreateEphemeralPlan() // Will be called once when the page loads, since state.js is a service
    .then((ephemeralPlan) => {
      service.setPlan(ephemeralPlan)
  })

  service.makeCurrentPlanNonEphemeral = (planName) => {
    var newPlan = JSON.parse(JSON.stringify(service.plan.getValue()))
    newPlan.name = planName
    newPlan.ephemeral = false
    newPlan.latitude = service.defaultPlanCoordinates.latitude
    newPlan.longitude = service.defaultPlanCoordinates.longitude
    newPlan.tagMapping = {"global":service.currentPlanTags.map(tag => tag.id)}
    service.getAddressFor(newPlan.latitude, newPlan.longitude)
      .then((address) => {
        newPlan.areaName = address
        var userId = service.getUserId()
        return $http.put(`/service/v1/plan?user_id=${userId}`, newPlan)
      })
      .then((result) => {
        if (result.status >= 200 && result.status <= 299) {
          // Plan has been saved in the DB. Reload it
          service.setPlan(result.data)
      } else {
          console.error('Unable to make plan permanent')
          console.error(result)
        }
      })
  }

  service.copyCurrentPlanTo = (planName) => {
    var newPlan = JSON.parse(JSON.stringify(service.plan.getValue()))
    newPlan.name = planName
    newPlan.ephemeral = false
    // Only keep the properties needed to create a plan
    var validProperties = new Set(['projectId', 'areaName', 'latitude', 'longitude', 'ephemeral', 'name', 'zoomIndex'])
    var keysInPlan = Object.keys(newPlan)
    keysInPlan.forEach((key) => {
      if (!validProperties.has(key)) {
        delete newPlan[key]
      }
    })
    var userId = service.getUserId()
    var url = `/service/v1/plan-command/copy?user_id=${userId}&source_plan_id=${service.plan.getValue().id}&is_ephemeral=${newPlan.ephemeral}&name=${newPlan.name}`
    return $http.post(url, {})
      .then((result) => {
        if (result.status >= 200 && result.status <= 299) {
          return service.loadPlan(result.data.id)
        } else {
          console.error('Unable to copy plan')
          console.error(result)
          return Promise.reject()
        }
      })
  }

  service.loadPlan = (planId) => {
    var userId = service.getUserId()
    return $http.get(`/service/v1/plan/${planId}?user_id=${userId}`)
      .then((result) => {
        return service.setPlan(result.data)
      })
      .then(() => {
        var plan = service.plan.getValue()
        service.requestSetMapCenter.next({ latitude: plan.latitude, longitude: plan.longitude })
        service.requestSetMapZoom.next(plan.zoomIndex)
        return Promise.resolve()
      })
  }

    // The Nuclear option - Delete the tile data and HTML elements cache and force Google Maps to call
    // our getTile() method again. Any rendering that is in process for the existing tiles will
    // continue but will not be shown on our map.
  service.recreateTilesAndCache = () => {
    tileDataService.clearDataCache()
    service.requestRecreateTiles.next({})
    service.requestMapLayerRefresh.next({})
  }

  service.setPlan = (plan) => {
    service.plan.next(plan)
    return service.loadPlanInputs(plan.id)
    .then(() => {
      service.recreateTilesAndCache()
      return Promise.resolve()
    })
  }

  // Load the plan inputs for the given plan and populate them in state
  service.loadPlanInputs = (planId) => {
    var userId = service.getUserId()
    return $http.get(`/service/v1/plan/${planId}/inputs?user_id=${userId}`)
      .then((result) => {
        var planInputs = Object.keys(result.data).length > 0 ? result.data : service.getDefaultPlanInputs()
        stateSerializationHelper.loadStateFromJSON(service, optimization, planInputs)
        return Promise.all([
          service.reloadSelectedLocations(),
          service.reloadSelectedServiceAreas(),
          service.loadPlanDataSelectionFromServer(),
          service.loadPlanResourceSelectionFromServer(),
          service.loadNetworkConfigurationFromServer()
        ])
      })
      .catch((err) => {
        console.log(err)
      })
  }

  service.hasLocationType = (locationKey) => {
    var hasLocationType = false
    service.locationTypes.getValue().forEach((locationType) => {
      if (locationType.checked && locationType.key.indexOf(locationKey) >= 0) {
        hasLocationType = true
      }
    })
    return hasLocationType
  }

  service.networkNodeTypesEntity = {}
  service.networkNodeTypes = {}
  //Load NetworkNodeTypesEntity
  service.loadNetworkNodeTypesEntity = () => {
    return new Promise((resolve, reject) => {
      $http.get('/service/odata/NetworkNodeTypesEntity')
        .then((response) => {
          if (response.status >= 200 && response.status <= 299) {
            service.networkNodeTypes = response.data
            response.data.forEach((entityType) => {
              service.networkNodeTypesEntity[entityType.name] = entityType.description
            })
            resolve()
          } else {
            reject(response)
          }
        })
    })
  }
  service.loadNetworkNodeTypesEntity()

  // optimization services
  service.modifyDialogResult = Object.freeze({
    SAVEAS: 0,
    OVERWRITE: 1
  })
  service.progressPollingInterval = null
  service.progressMessage = ''
  service.progressPercent = 0
  service.isCanceling = false  // True when we have requested the server to cancel a request
  service.Optimizingplan = null

  service.handleModifyClicked = () => {
    var currentPlan = service.plan.getValue()
    var userId = service.getUserId()
    if (currentPlan.ephemeral) {
      // This is an ephemeral plan. Don't show any dialogs to the user, simply copy this plan over to a new ephemeral plan
      var url = `/service/v1/plan-command/copy?user_id=${userId}&source_plan_id=${currentPlan.id}&is_ephemeral=${currentPlan.ephemeral}`
      return $http.post(url, {})
        .then((result) => {
          if (result.status >= 200 && result.status <= 299) {
            service.setPlan(result.data, true)
            return Promise.resolve()
          }
        })
        .catch((err) => {
          console.log(err)
          return Promise.reject()
        })
    } else {
      // This is not an ephemeral plan. Show a dialog to the user asking whether to overwrite current plan or save as a new one.
      return service.showModifyQuestionDialog()
        .then((result) => {
          if (result === service.modifyDialogResult.SAVEAS) {
            // Ask for the name to save this plan as, then save it
            return new Promise((resolve, reject) => {
              swal({
                title: 'Plan name required',
                text: 'Enter a name for saving the plan',
                type: 'input',
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Create Plan'
              },
              (planName) => {
                if (planName) {
                  return service.copyCurrentPlanTo(planName)
                  .then(()=> {return resolve()})
                }
              })
            })
          } else if (result === service.modifyDialogResult.OVERWRITE) {
            // Overwrite the current plan. Delete existing results. Reload the plan from the server.
            return $http.delete(`/service/v1/plan/${currentPlan.id}/analysis?user_id=${userId}`)
              .then((result) => {
                return service.loadPlan(currentPlan.id)
                .then(() => {
                  tileDataService.clearDataCache()
                  tileDataService.markHtmlCacheDirty()
                  service.requestMapLayerRefresh.next({})
                  return Promise.resolve()
                })
              })
          }
        })
        .catch((err) => {
          console.log(err)
          return Promise.reject()
        })
    }
  }

  // Clear the tile cache for plan outputs like fiber, 5G nodes, etc.
  service.clearTileCachePlanOutputs = () => {
    // The tile cache will clear all cache entries whose keys contain the given keywords
    tileDataService.clearDataCacheContaining(configuration.networkEquipment.tileCacheKeywords)
  }

  service.showModifyQuestionDialog = () => {
    return new Promise((resolve, reject) => {
      swal({
        title: '',
        text: 'You are modifying a plan with a completed analysis. Do you wish to save into a new plan or overwrite the existing plan?  Overwriting will clear all results which were previously run.',
        type: 'info',
        confirmButtonColor: '#b9b9b9',
        confirmButtonText: 'Save as',
        cancelButtonColor: '#DD6B55',
        cancelButtonText: 'Overwrite',
        showCancelButton: true,
        closeOnConfirm: false
      }, (wasConfirmClicked) => {
        resolve(wasConfirmClicked ? service.modifyDialogResult.SAVEAS : service.modifyDialogResult.OVERWRITE)
      })
    })
  }

  service.runOptimization = () => {
    
    service.clearTileCachePlanOutputs()
    tileDataService.markHtmlCacheDirty()
    service.requestMapLayerRefresh.next({})

    // Get the optimization options that we will pass to the server
    var optimizationBody = service.getOptimizationBody()
    // Make the API call that starts optimization calculations on aro-service
    var apiUrl = (service.networkAnalysisType.type === 'NETWORK_ANALYSIS') ? '/service/v1/analyze/masterplan' : '/service/v1/optimize/masterplan'
    $http.post(apiUrl, optimizationBody)
      .then((response) => {
        console.log(response)
        if (response.status >= 200 && response.status <= 299) {
          service.Optimizingplan.optimizationId = response.data.optimizationIdentifier
          service.startPolling()
        } else {
          console.error(response)
        }
      })
  }

  service.startPolling = () => {
    service.stopPolling()
    service.progressPollingInterval = setInterval(() => {
      $http.get(`/service/optimization/processes/${service.Optimizingplan.optimizationId}`).then((response) => {
        var newPlan = JSON.parse(JSON.stringify(service.plan.getValue()))
        newPlan.planState = response.data.optimizationState
        service.plan.next(newPlan)
        if (response.data.optimizationState === 'COMPLETED'
            || response.data.optimizationState === 'CANCELED'
            || response.data.optimizationState === 'FAILED') {
          service.stopPolling()
          service.clearTileCachePlanOutputs()
          tileDataService.markHtmlCacheDirty()
          service.requestMapLayerRefresh.next({})
          delete service.Optimizingplan.optimizationId
          service.loadPlanInputs(newPlan.id)
        }
        var diff = (Date.now() - new Date(response.data.startDate).getTime()) / 1000
        var minutes = Math.floor(diff / 60)
        var seconds = Math.ceil(diff % 60)
        service.progressPercent = response.data.progress * 100
        service.progressMessage = `${minutes < 10 ? '0': ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds} Runtime`
      })
    }, 1000)
  }

  service.stopPolling = () => {
    if (service.progressPollingInterval) {
      clearInterval(service.progressPollingInterval)
      service.progressPollingInterval = null
    }
  }

  service.cancelOptimization = () => {
    service.stopPolling()
    service.isCanceling = true
    $http.delete(`/service/optimization/processes/${service.Optimizingplan.optimizationId}`)
      .then((response) => {
        // Optimization process was cancelled. Get the plan status from the server
        return $http.get(`/service/v1/plan/${service.Optimizingplan.id}?user_id=${service.getUserId()}`)
      })
      .then((response) => {
        service.isCanceling = false
        if (response.status >= 200 && response.status <= 299) {
          service.Optimizingplan.planState = response.data.planState
          delete service.Optimizingplan.optimizationId
          service.clearTileCachePlanOutputs()
          tileDataService.markHtmlCacheDirty()
          service.requestMapLayerRefresh.next({})
        }
      })
      .catch((err) => {
        console.error(err)
        service.isCanceling = false
      })
  }

  service.plan.subscribe((newPlan) => {
    service.stopPolling()
    service.Optimizingplan = newPlan
    service.isCanceling = false
    if (service.Optimizingplan && service.Optimizingplan.planState === 'STARTED') {
      // Optimization is in progress. We can start polling for the results
      service.startPolling()
    }
  })

  service.getDefaultPlanInputs = () => {
    return {
      analysis_type: "NETWORK_PLAN",
      financialConstraints: {
        cashFlowStrategyType: "EXTERNAL",
          discountRate: 0.06,
            years: 15
        },
      locationConstraints: {
        locationTypes: [],
        analysisSelectionMode: "SELECTED_AREAS"
      },
      networkConstraints: {
        networkTypes: [
          "Fiber"
        ],
        routingMode: "DIRECT_ROUTING"
      },
      optimization: {
        algorithmType: "DEFAULT",
        algorithm: "UNCONSTRAINED"
      },
    }
  }

  service.censusBlockSelectedEvent = new Rx.BehaviorSubject({})
  $rootScope.$on('map_layer_census_block_click',(e,cbdata) => {
    service.censusBlockSelectedEvent.next(cbdata)
    $timeout()
  })

  service.showDirectedCable = false
  service.showSiteBoundary = false
  service.boundaryTypes = []
  service.selectedBoundaryType = {}

  var loadBoundaryLayers = function () {
    return $http.get(`/service/boundary_type`)
    .then((result) => {
      service.boundaryTypes = result.data
      service.selectedBoundaryType = result.data[0]
    })  
  }

  loadBoundaryLayers()

  service.listOfTags = []
  service.currentPlanTags = []
  service.loadListOfPlanTags = () => {
    return $http.get(`/service/tag-mapping/tags`)
    .then((result) => {
      service.listOfTags = result.data
    }) 
  }

  service.loadListOfPlanTags()

  return service
}])
