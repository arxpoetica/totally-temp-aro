import StateViewMode from './state-view-mode'

/* global app localStorage map */
class State {
//app.service('state', ['$rootScope', '$http', '$document', '$timeout', '$sce', 'map_layers', 'optimization', 'stateSerializationHelper', '$filter','tileDataService', 'Utils', 'tracker', ($rootScope, $http, $document, $timeout, $sce, map_layers, configuration, optimization, stateSerializationHelper, $filter, tileDataService, Utils, tracker) => {

  constructor($rootScope, $http, $document, $timeout, $sce, optimization, stateSerializationHelper, $filter, tileDataService, Utils, tracker) {
  // Important: RxJS must have been included using browserify before this point
  var Rx = require('rxjs')

  var service = {}
  service.INVALID_PLAN_ID = -1
  service.MAX_EXPORTABLE_AREA = 11000000000 //25000000

  service.StateViewMode = StateViewMode

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
  service.mapReadyPromise = new Promise((resolve, reject) => {
    $document.ready(() => {
      // At this point we will have access to the global map variable
      map.ready(() => resolve())
    })
  })

  //toolbar actions
  service.toolbarActions = Object.freeze({
    SINGLE_SELECT: 1,
    POLYGON_SELECT: 2,
    POLYGON_EXPORT: 3
  });
  service.selectedToolBarAction = null
  service.resetToolBarAction = () => {
    service.selectedToolBarAction = null
  }

  service.showEquipmentLabels = false

  // The selection modes for the application
  service.selectionModes = {
    SELECTED_AREAS: 'SELECTED_AREAS', 
    SELECTED_LOCATIONS: 'SELECTED_LOCATIONS'
  }
  
  service.areaSelectionModes = {
      SINGLE: 'single',
      GROUP: 'group'
  }
  
  service.areaSelectionMode = service.areaSelectionModes.SINGLE
  //service.areaSelectionMode = service.areaSelectionModes.GROUP
  
  // The selected panel when in the View mode
  service.viewModePanels = Object.freeze({
    LOCATION_INFO: 'LOCATION_INFO',
    EQUIPMENT_INFO: 'EQUIPMENT_INFO',
    BOUNDARIES_INFO: 'BOUNDARIES_INFO',
    ROAD_SEGMENT_INFO: 'ROAD_SEGMENT_INFO',
    PLAN_SUMMARY_REPORTS: 'PLAN_SUMMARY_REPORTS',
    COVERAGE_BOUNDARY: 'COVERAGE_BOUNDARY',
    EDIT_LOCATIONS: 'EDIT_LOCATIONS',
    PLAN_INFO: 'PLAN_INFO'
  })
  service.activeViewModePanel = service.viewModePanels.LOCATION_INFO

  // The selected panel when in the edit plan mode
  service.EditPlanPanels = Object.freeze({
    EDIT_PLAN: 'EDIT_PLAN',
    PLAN_SUMMARY: 'PLAN_SUMMARY'
  })
  service.activeEditPlanPanel = service.EditPlanPanels.EDIT_PLAN

  // service.allowViewModeClickAction = () => {
  //   return (service.selectedDisplayMode.getValue() === service.displayModes.VIEW || service.selectedDisplayMode.getValue() === service.displayModes.EDIT_PLAN) && 
  //   service.activeViewModePanel !== service.viewModePanels.EDIT_LOCATIONS && //location edit shouldn't perform other action
  //   !service.isRulerEnabled //ruler mode click should not enable other  view action
  // }

  service.routingModes = {
    DIRECT_ROUTING: 'Direct Routing',
    ODN_1: 'Hub-only split',
    ODN_2: 'Hub-distribution split',
    ODN_3: 'Hybrid split'
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
      generatePlanLocationLinks : false,
      generateSubnetLinking: true
    },
    analysisSelectionMode: service.selectionModes.SELECTED_AREAS
  }

  if(config.ARO_CLIENT === 'frontier')
    service.optimizationOptions.technologies['FiveG'].label = 'Fixed Wireless'

  //set default values for uiSelectedAlgorithm & selectedgeographicalLayer
  //158954857: disabling some optimization types
  service.optimizationOptions.uiAlgorithms = [
    service.OPTIMIZATION_TYPES.UNCONSTRAINED,
    //service.OPTIMIZATION_TYPES.MAX_IRR,
    service.OPTIMIZATION_TYPES.BUDGET,
    //service.OPTIMIZATION_TYPES.IRR_TARGET,
    //service.OPTIMIZATION_TYPES.IRR_THRESH,
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

  //ruler actions
  service.allRulerActions = Object.freeze({
    STRAIGHT_LINE:{ id: 'STRAIGHT_LINE', label: 'Straight Line' },
    ROAD_SEGMENT:{ id: 'ROAD_SEGMENT', label: 'Road Segment' },
    COPPER: { id: 'COPPER', label: 'Copper' }
  });

  service.rulerActions = [
    service.allRulerActions.STRAIGHT_LINE,
    service.allRulerActions.ROAD_SEGMENT
  ]

  service.currentRulerAction = service.allRulerActions.STRAIGHT_LINE

  service.isRulerEnabled = false

  //Boundary Layer Mode
  service.boundaryLayerMode = Object.freeze({
    VIEW: 'VIEW',
    SEARCH: 'SEARCH'
  })

  service.activeboundaryLayerMode = service.boundaryLayerMode.SEARCH

  // The panels in the view mode

  // Map layers data - define once. Details on map layer objects are available in the TileComponentController class in tile-component.js
  service.mapLayers = new Rx.BehaviorSubject({})
  var heatmapOptions = {
    showTileExtents: false,
    heatMap: {
      useAbsoluteMax: false,
      maxValue: 100,
      powerExponent: 0.5,
      worldMaxValue: 500000
    },
    selectedHeatmapOption: service.viewSetting.heatmapOptions[0]
  }
  if (config.ARO_CLIENT === 'frontier') {
    heatmapOptions.selectedHeatmapOption = service.viewSetting.heatmapOptions.filter((option) => option.id === 'HEATMAP_OFF')[0]
  }  
  service.mapTileOptions = new Rx.BehaviorSubject(heatmapOptions)

  service.defaultPlanCoordinates = {
    zoom: 14,
    latitude: 47.6062,      // Seattle, WA by default. For no particular reason.
    longitude: -122.3321,   // Seattle, WA by default. For no particular reason.
    areaName: 'Seattle, WA' // Seattle, WA by default. For no particular reason.
  }
  service.requestMapLayerRefresh = new Rx.BehaviorSubject({})
  service.requestCreateMapOverlay = new Rx.BehaviorSubject(null)
  service.requestDestroyMapOverlay = new Rx.BehaviorSubject(null)
  service.showGlobalSettings = false
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
  service.dragStartEvent = new Rx.BehaviorSubject()
  service.dragEndEvent = new Rx.BehaviorSubject()
  service.showPlanResourceEditorModal = false
  service.editingPlanResourceKey = null
  service.isLoadingPlan = false
  service.expertModeBody = null
  //This modal will be used to toogle from report modal to current modal 
  //service.previousModal

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
  
  
  service.censusCategories = new Rx.BehaviorSubject()
  service.reloadCensusCategories = (censusCategories) => {
    service.censusCategories.next(censusCategories)
    service.requestMapLayerRefresh.next(null)
  }
  
  service.selectedCensusCategoryId = new Rx.BehaviorSubject()
  service.reloadSelectedCensusCategoryId = (catId) => {
    service.selectedCensusCategoryId.next(catId)
    service.requestMapLayerRefresh.next(null)
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
    SINGLE_PLAN_TARGET: 0,
    POLYGON_PLAN_TARGET: 1,
    POLYGON_EXPORT_TARGET: 2,
    COVERAGE_BOUNDARY: 5
  })
  service.selectedTargetSelectionMode = service.targetSelectionModes.SINGLE_PLAN_TARGET

  //location filters for sales
  service.locationFilters =[
    {
      id: 1,
      label: "Prospect",
      name: "prospect",
      iconUrl: "/images/map_icons/aro/prospects.png",
      checked: false
    },
    {
      id: 2,
      label: "Winback",
      name: "winback",
      iconUrl: "/images/map_icons/aro/winback.png",
      checked: false,
    },
    {
      id: 3,
      label: "Customer",
      name: "customer",
      iconUrl: "/images/map_icons/aro/customers.png",
      checked: false
    }
  ]

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
      strokeStyle: service.StateViewMode.hsvToRgb(hue, 0.5, 0.5),
      fillStyle: service.StateViewMode.hsvToRgb(hue, 0.8, 0.5)
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
          service.requestMapLayerRefresh.next(null)
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
          service.requestMapLayerRefresh.next(null)
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

  service.selectedServiceArea = new Rx.BehaviorSubject()
  service.selectedAnalysisArea = new Rx.BehaviorSubject()
  service.selectedViewFeaturesByType = new Rx.BehaviorSubject({})
  service.selectedCensusBlockId = new Rx.BehaviorSubject()
  service.selectedRoadSegments = new Rx.BehaviorSubject(new Set())

  // Plan - define once
  service.plan = new Rx.BehaviorSubject(null)

  // Initialize the state of the application (the parts that depend upon configuration being loaded from the server)
  service.initializeState = function () {

    service.reloadLocationTypes()
    service.selectedDisplayMode.next(service.displayModes.VIEW)
    service.optimizationOptions.analysisSelectionMode = service.selectionModes.SELECTED_AREAS

    service.networkAnalysisTypes = [
      { id: 'NETWORK_PLAN', label: 'Network Build', type: "NETWORK_PLAN" },
      { id: 'NETWORK_ANALYSIS', label: 'Network Analysis', type: "NETWORK_ANALYSIS" },
      { id: 'Coverage_ANALYSIS', label: 'Coverage Analysis', type: "COVERAGE" },
      { id: 'NEARNET_ANALYSIS', label: 'Near-net Analysis', type: "UNDEFINED" },
      { id: 'EXPERT_MODE', label: 'Expert Mode', type: "Expert" }
    ]
    service.networkAnalysisType = service.networkAnalysisTypes[0]

    //Upload Data Sources
    service.uploadDataSources = []
    service.dataItems = {}

  }

  service.reloadLocationTypes = () => {
    var locationTypes = []
    var locations = service.configuration.locationCategories.categories
    Object.keys(locations).forEach((locationKey) => {
      var location = locations[locationKey]

      if (service.configuration.perspective.locationCategories[locationKey].show) {
          location.checked = location.selected
          locationTypes.push(location)
      }
    })
    service.locationTypes.next(locationTypes)
    service.constructionSites.next(angular.copy(locationTypes))
  }

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

  service.loadPlanDataSelectionFromServer = () => {

    if(!service.plan) {
      return Promise.resolve()
    }

    var currentPlan = service.plan.getValue()
    var promises = [
      $http.get('/service/odata/datatypeentity'),
      $http.get(`/service/v1/library-entry?user_id=${service.loggedInUser.id}`),
      $http.get(`/service/v1/plan/${currentPlan.id}/configuration?user_id=${service.loggedInUser.id}`)
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
          if (dataTypeEntity.maxValue > 0) {
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
      $http.get(`/service/v1/plan/${currentPlan.id}/configuration?user_id=${service.loggedInUser.id}`)
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

  service.getDefaultProjectForUser = (userId) => {
    return $http.get(`/service/auth/users/${userId}/configuration`)
      .then((result) => Promise.resolve(result.data.projectTemplateId))
      .catch((err) => console.error(err))
  }

  service.loadNetworkConfigurationFromServer = () => {
    return service.getDefaultProjectForUser(service.loggedInUser.id)
    .then((projectTemplateId) => $http.get(`/service/v1/project-template/${projectTemplateId}/network_configuration?user_id=${service.loggedInUser.id}`))
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
    $http.put(`/service/v1/plan/${currentPlan.id}/configuration?user_id=${service.loggedInUser.id}`, putBody)
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
    $http.put(`/service/v1/plan/${currentPlan.id}/configuration?user_id=${service.loggedInUser.id}`, putBody)
  }

  // Save the Network Configurations to the server
  service.saveNetworkConfigurationToDefaultProject = () => {
    return service.getDefaultProjectForUser(service.loggedInUser.id)
      .then((projectTemplateId) => {
        // Making parallel calls causes a crash in aro-service. Make sequential calls.
        var lastResult = Promise.resolve()
        Object.keys(service.networkConfigurations).forEach((networkConfigurationKey) => {
          var url = `/service/v1/project-template/${projectTemplateId}/network_configuration/${networkConfigurationKey}?user_id=${service.loggedInUser.id}`
          lastResult = lastResult.then(() => $http.put(url, service.networkConfigurations[networkConfigurationKey]))
        })
      })
      .catch((err) => console.error(err))
  }

  // Get the default project template id for a given user
  service.getDefaultProjectTemplate = (userId) => {
    return $http.get(`/service/auth/users/${service.loggedInUser.id}/configuration`)
      .then((result) => Promise.resolve(result.data.projectTemplateId))
      .catch((err) => console.error(err))
  }

  service.createNewPlan = (isEphemeral, planName, parentPlan) => {
    if (isEphemeral && parentPlan) {
      return Promise.reject('ERROR: Ephemeral plans cannot have a parent plan')
    }

    // Use reverse geocoding to get the address at the current center of the map
    var planOptions = {
      areaName: '',
      latitude: service.defaultPlanCoordinates.latitude,
      longitude: service.defaultPlanCoordinates.longitude,
      zoomIndex: service.defaultPlanCoordinates.zoom,
      ephemeral: isEphemeral,
      name: planName || 'Untitled'
    }
    return service.getAddressFor(planOptions.latitude, planOptions.longitude)
      .then((address) => {
        planOptions.areaName = address
        // Get the configuration for this user - this will contain the default project template to use
        return $http.get(`/service/auth/users/${service.loggedInUser.id}/configuration`)
      })
      .then((result) => {
        const userId = service.loggedInUser.id
        var apiEndpoint = `/service/v1/plan?user_id=${userId}&project_template_id=${result.data.projectTemplateId}`
        if (!isEphemeral && parentPlan) {
          //associate selected tags to child plan
          planOptions.tagMapping = {
            global: [],
            linkTags: {
              geographyTag: "service_area",
              serviceAreaIds: []
            }
          }
          planOptions.tagMapping.global = service.currentPlanTags.map(tag => tag.id)
          planOptions.tagMapping.linkTags.serviceAreaIds = service.currentPlanServiceAreaTags.map(tag => tag.id)
          // A parent plan is specified - append it to the POST url
          apiEndpoint += `&branch_plan=${parentPlan.id}`
        }
        return $http.post(apiEndpoint, planOptions)
      })
      .catch((err) => console.error(err))
  }

  // Gets the last ephemeral plan in use, or creates a new one if no ephemeral plan exists.
  service.getOrCreateEphemeralPlan = () => {
    var userId = service.loggedInUser.id
    return $http.get(`/service/v1/plan/ephemeral/latest?user_id=${userId}`)
      .then((result) => {
        // We have a valid ephemeral plan if we get back an object with *some* properties
        var isValidEphemeralPlan = Object.getOwnPropertyNames(result.data).length > 0
        if (isValidEphemeralPlan) {
          // We have a valid ephemeral plan. Return it.
          return Promise.resolve(result)
        } else {
          // We dont have an ephemeral plan. Create one and send it back
          tracker.trackEvent(tracker.CATEGORIES.NEW_PLAN, tracker.ACTIONS.CLICK)
          return service.createNewPlan(true)
        }
      })
  }

  service.makeCurrentPlanNonEphemeral = (planName) => {
    var newPlan = JSON.parse(JSON.stringify(service.plan.getValue()))
    newPlan.name = planName
    newPlan.ephemeral = false
    newPlan.latitude = service.defaultPlanCoordinates.latitude
    newPlan.longitude = service.defaultPlanCoordinates.longitude
    delete newPlan.optimizationId
    newPlan.tagMapping = {
      global:[],
      linkTags:{
        geographyTag: "service_area",
        serviceAreaIds: []
      }
    }
    newPlan.tagMapping.global = service.currentPlanTags.map(tag => tag.id)
    newPlan.tagMapping.linkTags.serviceAreaIds = service.currentPlanServiceAreaTags.map(tag => tag.id)
    //newPlan.tagMapping = {"global":service.currentPlanTags.map(tag => tag.id)}
    service.getAddressFor(newPlan.latitude, newPlan.longitude)
      .then((address) => {
        newPlan.areaName = address
        var userId = service.loggedInUser.id
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

  // Copies the settings from a project template to a plan
  service.copyProjectSettingsToPlan = (projectTemplateId, planId, userId) => {
    return $http.get(`/service/v1/project-template/${projectTemplateId}/configuration?user_id=${userId}`)
      .then((result)=> $http.put(`/service/v1/plan/${planId}/configuration?user_id=${userId}`, result.data))
      .then(() => service.loadPlanInputs(planId))
      .then(()=> service.loadNetworkConfigurationFromServer())
      .then(() => service.recreateTilesAndCache())
      .catch((err) => console.error(err))
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
    var userId = service.loggedInUser.id
    var url = `/service/v1/plan-command/copy?user_id=${userId}&source_plan_id=${service.plan.getValue().id}&is_ephemeral=${newPlan.ephemeral}&name=${newPlan.name}`

    return $http.post(url, {})
      .then((result) => {
        if (result.status >= 200 && result.status <= 299) {
          var center = map.getCenter()
          result.data.latitude = center.lat()
          result.data.longitude = center.lng()
          return $http.put(`/service/v1/plan?user_id=${userId}`, result.data)
        } else {
          console.error('Unable to copy plan')
          console.error(result)
          return Promise.reject()
        }
      })
      .then((result) => {
        return service.loadPlan(result.data.id)
      })  
  }

  service.loadPlan = (planId) => {
    tracker.trackEvent(tracker.CATEGORIES.LOAD_PLAN, tracker.ACTIONS.CLICK, 'PlanID', planId)
    service.selectedDisplayMode.next(service.displayModes.VIEW)
    var userId = service.loggedInUser.id
    var plan = null
    return $http.get(`/service/v1/plan/${planId}?user_id=${userId}`)
      .then((result) => {
        plan = result.data
        return service.getAddressFor(plan.latitude, plan.longitude)
      })
      .then((address) => {
        plan.areaName = address
        service.requestDestroyMapOverlay.next(null) // Make sure to destroy the map overlay before panning/zooming
        service.requestSetMapCenter.next({ latitude: plan.latitude, longitude: plan.longitude })
        service.requestSetMapZoom.next(plan.zoomIndex)
        return Promise.resolve()
      })
      .then(() => {
        return service.setPlan(plan)  // This will also create overlay, tiles, etc.
      })
  }

  // The Nuclear option - Delete the tile data and HTML elements cache and force Google Maps to call
  // our getTile() method again. Any rendering that is in process for the existing tiles will
  // continue but will not be shown on our map.
  service.recreateTilesAndCache = () => {
    tileDataService.clearDataCache()
    tileDataService.clearHtmlCache()
    return service.loadModifiedFeatures(service.plan.getValue().id)
      .then(() => {
        service.requestDestroyMapOverlay.next(null) // Destroy the old map overlay (may not exist if we have just loaded a plan)
        service.requestCreateMapOverlay.next(null)  // Create a new one
        service.mapLayers.next(service.mapLayers.getValue())  // Reset map layers so that the new overlay picks them up
        service.requestMapLayerRefresh.next(null)   // Redraw map layers
      })
      .catch((err) => console.error(err))
  }

  service.setPlan = (plan) => {
    service.plan.next(plan)
    service.planOptimization.next(plan)
    return service.loadPlanInputs(plan.id)
      .then(() => service.recreateTilesAndCache())
      .catch((err) => console.error(err))
  }

  // Load the plan inputs for the given plan and populate them in state
  service.loadPlanInputs = (planId) => {
    var userId = service.loggedInUser.id
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

  // Load the modified features for a given plan and save them in the tile data service
  service.loadModifiedFeatures = (planId) => {
    var promises = []
    promises.push( $http.get(`/service/plan-library-feature-mods/${planId}/equipment?userId=${service.loggedInUser.id}`)
      .then((result) => {
        result.data.forEach((feature) => tileDataService.addModifiedFeature(feature))
      })
      .catch((err) => console.error(err))
    )
    
    promises.push( $http.get(`/service/plan-library-feature-mods/${planId}/equipment_boundary?userId=${service.loggedInUser.id}`)
      .then((result) => {
        result.data.forEach((feature) => tileDataService.addModifiedBoundary(feature))
      })
      .catch((err) => console.error(err))
    )
    
    return Promise.all( promises )
  }

  service.locationInputSelected = (locationKey) => {
    return service.locationTypes.getValue().filter((locationType)=> {
        return locationType.checked && locationType.categoryKey === locationKey
    }).length > 0
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
    var userId = service.loggedInUser.id
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
                  service.requestMapLayerRefresh.next(null)
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
    service.requestMapLayerRefresh.next(null)

    // Get the optimization options that we will pass to the server
    var optimizationBody = service.getOptimizationBody()
    // Make the API call that starts optimization calculations on aro-service
    var apiUrl = (service.networkAnalysisType.type === 'NETWORK_ANALYSIS') ? '/service/v1/analyze/masterplan' : '/service/v1/optimize/masterplan'
    apiUrl += `?userId=${service.loggedInUser.id}`
    $http.post(apiUrl, optimizationBody)
      .then((response) => {
        //console.log(response)
        if (response.status >= 200 && response.status <= 299) {
          service.Optimizingplan.optimizationId = response.data.optimizationIdentifier
          service.startPolling()
        } else {
          console.error(response)
        }
      })
  }

  service.planOptimization = new Rx.BehaviorSubject(null)
  service.startPolling = () => {
    service.stopPolling()
    service.progressPollingInterval = setInterval(() => {
      $http.get(`/service/optimization/processes/${service.Optimizingplan.optimizationId}`).then((response) => {
        var newPlan = JSON.parse(JSON.stringify(service.plan.getValue()))
        newPlan.planState = response.data.optimizationState
        service.planOptimization.next(newPlan)
        service.checkPollingStatus(newPlan)
        if (response.data.optimizationState === 'COMPLETED'
            || response.data.optimizationState === 'CANCELED'
            || response.data.optimizationState === 'FAILED') {
          service.stopPolling()
          service.clearTileCachePlanOutputs()
          tileDataService.markHtmlCacheDirty()
          service.requestMapLayerRefresh.next(null)
          delete service.Optimizingplan.optimizationId
          service.loadPlanInputs(newPlan.id)
        }
        var diff = (Date.now() - new Date(response.data.startDate).getTime()) / 1000
        var minutes = Math.floor(diff / 60)
        var seconds = Math.ceil(diff % 60)
        service.progressPercent = response.data.progress * 100
        service.progressMessage = `${minutes < 10 ? '0': ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds} Runtime`
        $timeout()  // Trigger a digest cycle so that components can update
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
        return $http.get(`/service/v1/plan/${service.Optimizingplan.id}?user_id=${service.loggedInUser.id}`)
      })
      .then((response) => {
        service.isCanceling = false
        if (response.status >= 200 && response.status <= 299) {
          service.Optimizingplan.planState = response.data.planState
          delete service.Optimizingplan.optimizationId
          service.clearTileCachePlanOutputs()
          tileDataService.markHtmlCacheDirty()
          service.requestMapLayerRefresh.next(null)
        }
      })
      .catch((err) => {
        console.error(err)
        service.isCanceling = false
      })
  }

  service.checkPollingStatus = (newPlan) => {
    service.stopPolling()
    service.Optimizingplan = newPlan
    service.isCanceling = false
    if (service.Optimizingplan && service.Optimizingplan.planState === 'STARTED') {
      // Optimization is in progress. We can start polling for the results
      service.startPolling()
    }
  }

  service.plan.subscribe((newPlan) => {
    service.checkPollingStatus(newPlan)
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
        analysisSelectionMode: service.selectionModes.SELECTED_AREAS
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

  service.showDirectedCable = false
  service.showSiteBoundary = false
  service.boundaryTypes = []
  service.selectedBoundaryType = {}
  
  var loadCensusCatData = function () {
    return $http.get(`/service/tag-mapping/meta-data/census_block/categories`)
    .then((result) => {
      let censusCats = {}
      result.data.forEach( (cat) => {
        let tagsById = {}
        cat.tags.forEach( (tag) => {
          tag.colourHash = service.StateViewMode.getTagColour(tag)
          tagsById[ tag.id+'' ] = tag
        })
        cat.tags = tagsById
        censusCats[ cat.id+'' ] = cat
      })
      service.reloadCensusCategories(censusCats)
    })  
  }
  loadCensusCatData()
  
  var loadBoundaryLayers = function () {
    return $http.get(`/service/boundary_type`)
    .then((result) => {
      service.boundaryTypes = result.data
      service.boundaryTypes.push({id: result.data.length + 1, name: "fiveg_coverage", description: "Undefined"})
      service.boundaryTypes.sort((a, b) => a.id-b.id)
      service.selectedBoundaryType = service.boundaryTypes[0]
    })  
  }

  loadBoundaryLayers()

  service.listOfTags = []
  service.currentPlanTags = []
  service.listOfServiceAreaTags = []
  service.listOfCreatorTags = []
  service.currentPlanServiceAreaTags = []
  service.StateViewMode.loadListOfPlanTags($http,service)

  service.clearViewMode = new Rx.BehaviorSubject(false)
  service.clearEditingMode = new Rx.BehaviorSubject(false)
  service.clearToolbarActions = new Rx.BehaviorSubject(false)
  $rootScope.$on('map_tool_esc_clear_view_mode', () => {
    service.clearViewMode.next(true)
    service.clearEditingMode.next(true)
    service.clearToolbarActions.next(true)
  })

  service.flattenDeep = (arr) => {
    return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(service.flattenDeep(val)) : acc.concat(val), []);
  }
  
  service.isFeatureLayerOn = (categoryItemKey) => {
    var isOn = false
    if (service.configuration.networkEquipment.equipments.hasOwnProperty(categoryItemKey) 
        && service.configuration.networkEquipment.equipments[categoryItemKey].checked){
      isOn = true
    }
    return isOn
  }
  
  service.isFeatureLayerOnForBoundary = (boundaryFeature) => {
    // if it doesn't have a network_node_type return TRUE 
    var isOn = true
    var networkNodeType = ''
    if (boundaryFeature.network_node_type){
      networkNodeType = boundaryFeature.network_node_type
    }else if(boundaryFeature.properties && boundaryFeature.properties.network_node_type){
      networkNodeType = boundaryFeature.properties.network_node_type
    }
    if ('' != networkNodeType){
      isOn = service.isFeatureLayerOn(networkNodeType)
    }
    return isOn
  }
  
  service.entityTypeList = {
    LocationObjectEntity: [],
    NetworkEquipmentEntity: [],
    ServiceAreaView: [],
    CensusBlocksEntity: [],
    AnalysisArea: [],
    AnalysisLayer: []
  }
  //list of matched boundary list (ServiceAreaView/CensusBlocksEntity/AnalysisArea)
  service.entityTypeBoundaryList = []

  service.resetBoundarySearch = new Rx.BehaviorSubject(false)
  service.clearEntityTypeBoundaryList = () => {
    service.entityTypeBoundaryList = []
  }
  service.selectedBoundaryTypeforSearch = null
  
  service.systemActors = [] // All the system actors (i.e. users and groups)
  service.reloadSystemActors = () => {
    service.systemActors = []
    return $http.get('/service/auth/groups')
      .then((result) => {
        result.data.forEach((group) => {
          group.originalName = group.name
          // This is just horrible - get rid of this trustAsHtml asap. And no html in object properties!
          group.name = $sce.trustAsHtml(`<i class="fa fa-users" aria-hidden="true"></i> ${group.name}`)
          service.systemActors.push(group)
        })
        return $http.get('/service/auth/users')
      })
      .then((result) => {
        result.data.forEach((user) => {
          // This is just horrible - get rid of this trustAsHtml asap. And no html in object properties!
          user.name = $sce.trustAsHtml(`<i class="fa fa-user" aria-hidden="true"></i> ${user.firstName} ${user.lastName}`) 
          service.systemActors.push(user)
        })
      })
      .catch((err) => console.error(err))
  }
  service.reloadSystemActors()

  // The logged in user is currently set by using the AngularJS injector in index.html
  service.loggedInUser = null
  service.setLoggedInUser = (user) => {
    tracker.trackEvent(tracker.CATEGORIES.LOGIN, tracker.ACTIONS.CLICK, 'UserID', user.id)

    // Set the logged in user, then call all the initialization functions that depend on having a logged in user.
    service.loggedInUser = user

    service.isUserAdministrator(service.loggedInUser.id)
      .then((isAdministrator) => {
        service.loggedInUser.isAdministrator = isAdministrator
      })
      .catch((err) => console.error(err))

    // Populate the group ids that this user is a part of
    service.loggedInUser.groupIds = []
    $http.get(`/service/auth/users/${service.loggedInUser.id}`)
      .then((result) => service.loggedInUser.groupIds = result.data.groupIds)
      .catch((err) => console.error(err))

    var initializeToDefaultCoords = (plan) => {
      service.requestSetMapCenter.next({ latitude: service.defaultPlanCoordinates.latitude, longitude: service.defaultPlanCoordinates.longitude })
      service.requestSetMapZoom.next(service.defaultPlanCoordinates.zoom)
      service.setPlan(plan)
    }
    var plan = null
    service.getOrCreateEphemeralPlan() // Will be called once when the page loads, since state.js is a service
    .then((result) => {
      plan = result.data
      // Get the default location for this user
      return $http.get(`/service/auth/users/${user.id}/configuration`)
    })
    .then((result) => {
      // Default location may not be set for this user. In this case, use a system default
      const searchLocation = result.data.defaultLocation || service.defaultPlanCoordinates.areaName
      service.loggedInUser.perspective = result.data.perspective || 'default'
      service.configuration.loadPerspective(service.loggedInUser.perspective)
      service.initializeState()
      return $http.get(`/search/addresses?text=${searchLocation}&sessionToken=${Utils.getInsecureV4UUID()}`)
    })
    .then((result) => {
      if (result.data && result.data.length > 0 && result.data[0].type === 'placeId') {
        var geocoder = new google.maps.Geocoder;
        geocoder.geocode({'placeId': result.data[0].value}, function(geocodeResults, status) {
          if (status !== 'OK') {
            console.error('Geocoder failed: ' + status)
            console.error('Setting map coordinates to default')
            initializeToDefaultCoords(plan)
            return
          }
          service.requestSetMapCenter.next({
            latitude: geocodeResults[0].geometry.location.lat(),
            longitude: geocodeResults[0].geometry.location.lng()
          })
          const ZOOM_FOR_OPEN_PLAN = 14
          service.requestSetMapZoom.next(ZOOM_FOR_OPEN_PLAN)
          service.setPlan(plan)
        })
      } else {
        // Set it to the default so that the map gets initialized
        initializeToDefaultCoords(plan)
      }
    })
    .catch((err) => {
      console.error(err)
      // Set it to the default so that the map gets initialized
      initializeToDefaultCoords(plan)
    })
  }

  service.configuration = {}
  service.initializeAppConfiguration = (loggedInUser, appConfiguration) => {
    service.configuration = appConfiguration
    service.configuration.loadPerspective = (perspective) => {
      // If a perspective is not found, go to the default
      const defaultPerspective = service.configuration.uiVisibility.filter(item => item.name === 'default')[0]
      const thisPerspective = service.configuration.uiVisibility.filter(item => item.name === perspective)[0]
      service.configuration.perspective = thisPerspective || defaultPerspective
    }
    service.configuration.loadPerspective(loggedInUser.perspective)
    service.setLoggedInUser(loggedInUser)
    tileDataService.setLockIcon(service.configuration.locationCategories.entityLockIcon)
  }

  service.planEditorChanged = new Rx.BehaviorSubject(false)

  // Ask the user if they want to "steal" and existing transaction from another user.
  // If yes, steal it. If not, throw a rejection
  service.stealOrRejectTransaction = (transaction) => {
    // Get the name of the current owner of the transaction
    return $http.get(`/service/odata/userentity?$select=firstName,lastName&$filter=id eq ${transaction.userId}`)
      .then((result) => {
        const user = result.data[0]
        return new Promise((resolve, reject) => {
          swal({
            title: 'Overwrite transaction?',
            text: `${user.firstName} ${user.lastName} already has a transaction open for this plan. Do you want to overwrite this transaction?`,
            type: 'warning',
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'Yes, overwrite',
            cancelButtonText: 'No',
            showCancelButton: true,
            closeOnConfirm: true
          }, (stealTransaction) => {
            resolve(stealTransaction)
          })
        })
      })
      .then((stealTransaction) => {
        if (stealTransaction) {
          tracker.trackEvent(tracker.CATEGORIES.STEAL_PLAN_TRANSACTION, tracker.ACTIONS.CLICK)
          return $http.post(`/service/plan-transactions?force=true`, { userId: service.loggedInUser.id, planId: service.plan.getValue().id })
        } else {
          return Promise.reject('User does not want to steal the transaction')
        }
      })
  }

  service.resumeOrCreateTransaction = () => {

    // Workflow:
    // 1. If we don't have any transaction for this plan, create one
    // 2. If we have a transaction for this plan BUT not for the current user
    //    a. Ask if we want to steal the transaction. If yes, steal it. If not, show error message
    // 3. If we have a transaction for this plan and for this user, resume it

    // Get a list of all open transactions in the system (Do NOT send in userId so we get transactions across all users)
    return $http.get(`/service/plan-transaction`)
      .then((result) => {
        const currentPlanId = service.plan.getValue().id
        const transactionsForPlan = result.data.filter((item) => item.planId === currentPlanId)
        const transactionsForUserAndPlan = transactionsForPlan.filter((item) => item.userId === service.loggedInUser.id)
        if (transactionsForPlan.length === 0) {
          // A transaction does not exist. Create it.
          tracker.trackEvent(tracker.CATEGORIES.NEW_PLAN_TRANSACTION, tracker.ACTIONS.CLICK)
          return $http.post(`/service/plan-transactions`, { userId: service.loggedInUser.id, planId: currentPlanId })
        } else if (transactionsForUserAndPlan.length === 1) {
          // We have one open transaction for this user and plan combo. Resume it.
          tracker.trackEvent(tracker.CATEGORIES.RESUME_PLAN_TRANSACTION, tracker.ACTIONS.CLICK, 'TransactionID', transactionsForUserAndPlan[0].id)
          return Promise.resolve({ data: transactionsForUserAndPlan[0] }) // Using {data:} so that the signature is consistent
        } else if (transactionsForPlan.length === 1) {
          // We have one open transaction for this plan, but it was not started by this user. Ask the user what to do.
          return service.stealOrRejectTransaction(transactionsForPlan[0])
        }
      })
      .catch((err) => {
        // For transaction resume errors, log it and rethrow the exception
        console.warn(err)
        return Promise.reject(err)
      })
  }

  service.isUserAdministrator = (userId) => {
    var userAdminPermissions = null
    var userIsAdministrator = false, userGroupIsAdministrator = false
    var aclResult = null
    return $http.get('/service/auth/permissions')
      .then((result) => {
        // Get the permissions for the name USER_ADMIN
        userAdminPermissions = result.data.filter((item) => item.name === 'USER_ADMIN')[0].id
        return $http.get(`/service/auth/acl/SYSTEM/1`)
      })
      .then((result) => {
        aclResult = result.data
        // Get the acl entry corresponding to the currently logged in user
        var userAcl = aclResult.resourcePermissions.filter((item) => item.systemActorId === userId)[0]
        // The userAcl.rolePermissions is a bit field. If it contains the bit for "userAdminPermissions" then
        // the logged in user is an administrator.
        userIsAdministrator = (userAcl && (userAcl.rolePermissions & userAdminPermissions)) > 0
        return $http.get(`/service/auth/users/${userId}`)
      })
      .then((result) => {
        // Also check if the groups that the user belongs to have administrator permissions
        userGroupIsAdministrator = false
        result.data.groupIds.forEach((groupId) => {
          const userGroupAcl = aclResult.resourcePermissions.filter((item) => item.systemActorId === groupId)[0]
          const thisGroupIsAdministrator = (userGroupAcl && (userGroupAcl.rolePermissions & userAdminPermissions)) > 0
          userGroupIsAdministrator |= thisGroupIsAdministrator
        })
        const isAdministrator = userIsAdministrator || userGroupIsAdministrator
        return Promise.resolve(isAdministrator)
      })
      .catch((err) => console.error(err))
  }

  return service
//}])
}
}

State.$inject = ['$rootScope', '$http', '$document', '$timeout', '$sce', 'optimization', 'stateSerializationHelper', '$filter','tileDataService', 'Utils', 'tracker']

export default State