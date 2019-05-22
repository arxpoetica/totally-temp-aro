import { List, Map } from 'immutable'
import { createSelector } from 'reselect'
import format from './string-template'
import StateViewMode from './state-view-mode'
import Constants from '../components/common/constants'
import Actions from '../react/common/actions'
import UiActions from '../react/components/configuration/ui/ui-actions'
import UserActions from '../react/components/user/user-actions'
import PlanActions from '../react/components/plan/plan-actions'
import MapLayerActions from '../react/components/map-layers/map-layer-actions'
import SelectionActions from '../react/components/selection/selection-actions'
import PlanStates from '../react/components/plan/plan-states'
import SelectionModes from '../react/components/selection/selection-modes'
import SocketManager from '../react/common/socket-manager'

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllLocationLayers = reduxState => reduxState.mapLayers.location
const getLocationLayersList = createSelector([getAllLocationLayers], (locationLayers) => locationLayers.toJS())

const getAllNetworkEquipmentLayers = reduxState => reduxState.mapLayers.networkEquipment
const getNetworkEquipmentLayersList = createSelector([getAllNetworkEquipmentLayers], (networkEquipmentLayers) => networkEquipmentLayers)

const getAllBoundaryLayers = reduxState => reduxState.mapLayers.boundary
const getBoundaryLayersList = createSelector([getAllBoundaryLayers], (boundaries) => boundaries.toJS())

const getAllBoundaryTypesList = reduxState => reduxState.mapLayers.boundaryTypes
const getBoundaryTypesList = createSelector([getAllBoundaryTypesList], (boundaryTypes) => boundaryTypes.toJS())

const getselectedBoundaryType = reduxState => reduxState.mapLayers.selectedBoundaryType
const getSelectedBoundaryType = createSelector([getselectedBoundaryType], (selectedBoundaryType) => selectedBoundaryType.toJS())

/* global app localStorage map */
class State {
  constructor($rootScope, $http, $document, $timeout, $sce, $ngRedux, stateSerializationHelper, $filter, tileDataService, Utils, tracker, Notification) {
    // Important: RxJS must have been included using browserify before this point
    var Rx = require('rxjs')

    var service = {}
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(service)
    service.INVALID_PLAN_ID = -1
    service.MAX_EXPORTABLE_AREA = 11000000000 // 25000000

    service.StateViewMode = StateViewMode

    service.OPTIMIZATION_TYPES = {
      UNCONSTRAINED: { id: 'UNCONSTRAINED', algorithm: 'UNCONSTRAINED', label: 'Full Coverage' },
      MAX_IRR: { id: 'MAX_IRR', algorithm: 'IRR', label: 'Maximum IRR' },
      BUDGET: { id: 'BUDGET', algorithm: 'IRR', label: 'Budget' },
      IRR_TARGET: { id: 'IRR_TARGET', algorithm: 'IRR', label: 'Plan IRR Floor' },
      IRR_THRESH: { id: 'IRR_THRESH', algorithm: 'IRR', label: 'Segment IRR Floor' },
      TABC: { id: 'TABC', algorithm: 'CUSTOM', label: 'ABCD analysis' }, // Verizon-specific
      COVERAGE: { id: 'COVERAGE', algorithm: 'COVERAGE', label: 'Coverage Target' }
    }

    service.pruningStrategyTypes = {
      INTER_WIRECENTER: { id: 'INTER_WIRECENTER', label: 'Inter Service Area' },
      INTRA_WIRECENTER: { id: 'INTRA_WIRECENTER', label: 'Intra Service Area' }
    }

    service.terminalValueStrategyTypes = {
      NONE: { id: 'NONE', label: 'None' },
      FIXED_MULTIPLIER: { id: 'FIXED_MULTIPLIER', label: 'End Year Multiplier' },
      PERPUTUAL_GROWTH: { id: 'PERPUTUAL_GROWTH', label: 'Perpetual Growth' }
    }

    service.penetrationAnalysisStrategies = [
      { id: 'SCURVE', label: 'Curve Based' },
      { id: 'FLOW_SHARE', label: 'Flow Share' }
    ]

    service.connectionCostStrategies = [
      { id: 'NEW_CONNECTION', label: 'New Connection' },
      { id: 'REUSE_CONNECTION', label: 'Reuse Connection' }
    ]

    service.expertModeTypes = {
      OPTIMIZATION_SETTINGS: { id: 'OPTIMIZATION_SETTINGS', label: 'Optimization Settings' },
      MANUAL_PLAN_TARGET_ENTRY: { id: 'MANUAL_PLAN_TARGET_ENTRY', label: 'Manual plan Target Selection', isQueryValid: false },
      MANUAL_PLAN_SA_ENTRY: { id: 'MANUAL_PLAN_SA_ENTRY', label: 'Manual Plan Service Area Selection', isQueryValid: false }
    }

    service.selectedExpertMode = service.expertModeTypes['MANUAL_PLAN_TARGET_ENTRY'].id

    service.viewFiberOptions = [
      {
        id: 1,
        name: 'Uniform width'
      },
      {
        id: 2,
        name: 'Fiber Strand Count',
        field: 'fiber_strands',
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
        name: 'Atomic Unit Demand',
        field: 'atomic_units',
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

    // toolbar actions
    service.toolbarActions = Object.freeze({
      SINGLE_SELECT: 1,
      POLYGON_SELECT: 2,
      POLYGON_EXPORT: 3
    })
    service.selectedToolBarAction = null
    service.resetToolBarAction = () => {
      service.selectedToolBarAction = null
    }

    service.showEquipmentLabels = false
    service.equipmentLayerTypeVisibility = {
      existing: false,
      planned: false
    }

    service.fiberRoutingModes = {
      ROUTE_FROM_NODES: 'ROUTE_FROM_NODES',
      ROUTE_FROM_FIBER: 'ROUTE_FROM_FIBER'
    }

    // The selected panel when in the View mode
    service.viewModePanels = Object.freeze({
      LOCATION_INFO: 'LOCATION_INFO',
      EQUIPMENT_INFO: 'EQUIPMENT_INFO',
      BOUNDARIES_INFO: 'BOUNDARIES_INFO',
      ROAD_SEGMENT_INFO: 'ROAD_SEGMENT_INFO',
      PLAN_SUMMARY_REPORTS: 'PLAN_SUMMARY_REPORTS',
      COVERAGE_BOUNDARY: 'COVERAGE_BOUNDARY',
      EDIT_LOCATIONS: 'EDIT_LOCATIONS',
      EDIT_SERVICE_LAYER: 'EDIT_SERVICE_LAYER',
      PLAN_INFO: 'PLAN_INFO'
    })
    service.activeViewModePanel = service.viewModePanels.LOCATION_INFO

    // The selected panel when in the edit plan mode
    service.EditPlanPanels = Object.freeze({
      EDIT_PLAN: 'EDIT_PLAN',
      PLAN_SUMMARY: 'PLAN_SUMMARY'
    })
    service.activeEditPlanPanel = service.EditPlanPanels.EDIT_PLAN

    service.routingModes = {
      DIRECT_ROUTING: { id: 'DIRECT_ROUTING', label: 'Direct Routing' },
      ODN_1: { id: 'ODN_1', label: 'Hub-only split' },
      ODN_2: { id: 'ODN_2', label: 'Hub-distribution split' },
      ODN_3: { id: 'ODN_3', label: 'Hybrid split' }
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

    // ruler actions
    service.allRulerActions = Object.freeze({
      STRAIGHT_LINE: { id: 'STRAIGHT_LINE', label: 'Straight Line' },
      ROAD_SEGMENT: { id: 'ROAD_SEGMENT', label: 'Road Segment' },
      COPPER: { id: 'COPPER', label: 'Copper' }
    })

    service.rulerActions = [
      service.allRulerActions.STRAIGHT_LINE,
      service.allRulerActions.ROAD_SEGMENT
    ]

    service.currentRulerAction = service.allRulerActions.STRAIGHT_LINE

    service.isRulerEnabled = false

    // Boundary Layer Mode
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
    service.mapTileOptions = new Rx.BehaviorSubject(heatmapOptions)

    service.defaultPlanCoordinates = {
      zoom: 14,
      latitude: 47.6062, // Seattle, WA by default. For no particular reason.
      longitude: -122.3321, // Seattle, WA by default. For no particular reason.
      areaName: 'Seattle, WA' // Seattle, WA by default. For no particular reason.
    }
    service.requestMapLayerRefresh = new Rx.BehaviorSubject({})
    service.requestCreateMapOverlay = new Rx.BehaviorSubject(null)
    service.requestDestroyMapOverlay = new Rx.BehaviorSubject(null)
    service.showGlobalSettings = false
    service.showNetworkAnalysisOutput = false
    service.networkPlanModal = new Rx.BehaviorSubject(false)
    service.planInputsModal = new Rx.BehaviorSubject(false)
    service.splitterObj = new Rx.BehaviorSubject({})
    service.requestSetMapCenter = new Rx.BehaviorSubject({ latitude: service.defaultPlanCoordinates.latitude, longitude: service.defaultPlanCoordinates.longitude })
    service.requestSetMapZoom = new Rx.BehaviorSubject(service.defaultPlanCoordinates.zoom)
    service.showDetailedLocationInfo = new Rx.BehaviorSubject()
    service.showDetailedEquipmentInfo = new Rx.BehaviorSubject()
    service.showDataSourceUploadModal = new Rx.BehaviorSubject(false)
    service.dataItemsChanged = new Rx.BehaviorSubject({})
    service.viewSettingsChanged = new Rx.BehaviorSubject()
    service.measuredDistance = new Rx.BehaviorSubject()
    service.dragStartEvent = new Rx.BehaviorSubject()
    service.dragEndEvent = new Rx.BehaviorSubject()
    service.openGlobalSettingsView = new Rx.BehaviorSubject({})
    service.showPlanResourceEditorModal = false
    service.showRoicReportsModal = false
    service.editingPlanResourceKey = null
    service.isLoadingPlan = false
    service.expertMode = {
      OPTIMIZATION_SETTINGS: null,
      MANUAL_PLAN_TARGET_ENTRY: null,
      MANUAL_PLAN_SA_ENTRY: null
    }
    service.expertModeScopeContext = null

    service.hackRaiseEvent = (features) => {
      $rootScope.$broadcast('map_layer_clicked_feature', features, {})
    }
    service.mapFeaturesSelectedEvent = new Rx.BehaviorSubject({})

    // Raise an event requesting locations within a polygon to be selected. Coordinates are relative to the visible map.
    service.requestPolygonSelect = new Rx.BehaviorSubject({})

    service.areTilesRendering = false

    service.censusCategories = new Rx.BehaviorSubject()
    service.reloadCensusCategories = (censusCategories) => {
      service.censusCategories.next(censusCategories)
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

    // location filters for sales
    service.locationFilters = [
      {
        id: 1,
        label: 'Prospect',
        name: 'prospect',
        iconUrl: '/images/map_icons/aro/prospects.png',
        checked: false
      },
      {
        id: 2,
        label: 'Winback',
        name: 'winback',
        iconUrl: '/images/map_icons/aro/winback.png',
        checked: false
      },
      {
        id: 3,
        label: 'Customer',
        name: 'customer',
        iconUrl: '/images/map_icons/aro/customers.png',
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
      var r, g, b, i, f, p, q, t
      i = Math.floor(h * 6)
      f = h * 6 - i
      p = v * (1 - s)
      q = v * (1 - f * s)
      t = v * (1 - (1 - f) * s)
      switch (i % 6) {
        case 0: r = v, g = t, b = p; break
        case 1: r = q, g = v, b = p; break
        case 2: r = p, g = v, b = t; break
        case 3: r = p, g = q, b = v; break
        case 4: r = t, g = p, b = v; break
        case 5: r = v, g = p, b = q; break
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
        params: temp
      }
      return $http.get(`/competitors/v1/competitors/carriers/${service.competition.selectedCompetitorType.id}`, args)
        .then((response) => {
          if (response.status >= 200 && response.status <= 299) {
            service.competition.allCompetitors = $filter('orderBy')(response.data, 'name')
            // For now just populate random colors for each competitor. This can later come from the api.
            for (var iCompetitor = 0; iCompetitor < service.competition.allCompetitors.length; ++iCompetitor) {
              var randomColors = getRandomColors()
              service.competition.allCompetitors[iCompetitor].strokeStyle = randomColors.strokeStyle
              service.competition.allCompetitors[iCompetitor].fillStyle = randomColors.fillStyle
            }
          }
        })
    }

    // Hold all the selected tile elements like locations, service areas, etc.
    service.selection = {
      details: {
        analysisAreaId: null,
        censusBlockId: null,
        censusCategoryId: null,
        roadSegments: new Set(),
        serviceAreaId: null,
        fiberSegments: new Set(),
        siteBoundaryId: null,
      },
      editable: {
        equipment: {},
        location: {},
        serviceArea: {}
      }
    }

    // Why a cloneSelection() function? If we use angular.copy() on service.selection, the Set objects lose their "this" binding.
    // In that case, calling any function like size() on the Sets gives us an error. Note that we are not doing a deep clone at
    // this point because everything binds to the "selection" object, so just creating a selection object is sufficient.
    service.cloneSelection = () => {
      return {
        details: service.selection.details,
        editable: service.selection.editable
      }
    }

    // Hold a map of selected locations
    service.selectedLocationIcon = '/images/map_icons/aro/target.png'

    // Plan - define once
    service.plan = new Rx.BehaviorSubject(null)

    // Initialize the state of the application (the parts that depend upon configuration being loaded from the server)
    service.initializeState = function () {
      service.reloadLocationTypes()
      service.selectedDisplayMode.next(service.displayModes.VIEW)

      service.networkAnalysisTypes = [
        { id: 'NETWORK_PLAN', label: 'Network Build', type: 'NETWORK_PLAN' },
        { id: 'NETWORK_ANALYSIS', label: 'Network Analysis', type: 'NETWORK_ANALYSIS' },
        { id: 'COVERAGE_ANALYSIS', label: 'Coverage Analysis', type: 'COVERAGE' },
        { id: 'NEARNET_ANALYSIS', label: 'Near-net Analysis', type: 'UNDEFINED' },
        { id: 'EXPERT_MODE', label: 'Expert Mode', type: 'Expert' }
      ]
      service.networkAnalysisType = service.networkAnalysisTypes[0]

      // Upload Data Sources
      service.uploadDataSources = []
      service.pristineDataItems = {}
      service.dataItems = {}
    }

    service.reloadLocationTypes = () => {
      var locationTypesForRedux = List()
      var locations = service.configuration.locationCategories.categories
      var uiLayerId = 0
      Object.keys(locations).forEach((locationKey) => {
        var location = locations[locationKey]

        if (service.configuration.perspective.visibleLocationCategories.indexOf(locationKey) >= 0) {
          location.checked = location.selected
          location.uiLayerId = uiLayerId++
          locationTypesForRedux = locationTypesForRedux.push(JSON.parse(angular.toJson(location))) // angular.toJson will strip out the $$hashkey key
        }
      })

      $ngRedux.dispatch({
        type: Actions.LAYERS_SET_LOCATION,
        payload: locationTypesForRedux
      })
    }

    service.setLayerVisibility = (layer, isVisible) => {
      $ngRedux.dispatch(MapLayerActions.setLayerVisibility(layer, isVisible))
    }

    service.setLayerVisibilityByKey = (keyType, layerKey, isVisible) => {
      // First find the layer corresponding to the ID
      const layerState = $ngRedux.getState().mapLayers
      var layerToChange = null
      Object.keys(layerState).forEach(layerType => {
        layerState[layerType].forEach(layer => {
          if (layer[keyType] === layerKey) {
            layerToChange = layer
          }
        })
      })
      if (layerToChange) {
        $ngRedux.dispatch(MapLayerActions.setLayerVisibility(layerToChange, isVisible))
      }
    }

    service.getVisibleAnalysisLayers = () => $ngRedux.getState().mapLayers.boundary.filter(item => item.checked && (item.key === 'analysis_layer'))

    // Get a POST body that we will send to aro-service for performing optimization
    service.getOptimizationBody = () => {
      return stateSerializationHelper.getOptimizationBody(service, $ngRedux.getState())
    }

    // Load optimization options from a JSON string
    service.loadOptimizationOptionsFromJSON = (json) => {
      // Note that we are NOT returning the state (the state is set after the call), but a promise
      // that resolves once all the geographies have been loaded
      return stateSerializationHelper.loadStateFromJSON(service, service.getDispatchers(), json)
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
          $rootScope.$broadcast('map_zoom_changed')
        })
      } else {
        console.warn('Map object not found. Plan coordinates and zoom will not be updated when the user pans or zooms the map')
      }
    })

    service.getAddressFor = (latitude, longitude) => {
      return new Promise((resolve, reject) => {
        var geocoder = new google.maps.Geocoder()
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
          resolve(address) // Always resolve, even if reverse geocoding failed
        })
      })
    }

    service.loadPlanDataSelectionFromServer = () => {
      if (!service.plan) {
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
            if (dataTypeEntity.uploadSupported) {
              /*
              service.uploadDataSources.push({
                id: dataTypeEntity.id,
                label: dataTypeEntity.description,
                name: dataTypeEntity.name
              })
              */
              
              dataTypeEntity.label = dataTypeEntity.description
              service.uploadDataSources.push(dataTypeEntity)
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
              dataItem.selectedLibraryItems = dataItem.selectedLibraryItems.concat(matchedLibraryItem) // Technically there will be only one matched item
            })
          })

          service.dataItems = newDataItems
          service.pristineDataItems = angular.copy(service.dataItems)
          service.dataItemsChanged.next(service.dataItems)
          // get the service area for selected service layer datasource
          service.StateViewMode.loadListOfSAPlanTags($http, service, '', true)
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
          service.pristineResourceItems = angular.copy(service.resourceItems)
          $timeout() // Trigger a digest cycle so that components can update
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
      service.pristineDataItems = angular.copy(service.dataItems)
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
      service.pristineResourceItems = angular.copy(service.resourceItems)

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
          service.pristineNetworkConfigurations = angular.copy(service.networkConfigurations)

          var networkConfigurationsArray = []
          Object.keys(service.networkConfigurations).forEach((networkConfigurationKey) => {
            networkConfigurationsArray.push(service.networkConfigurations[networkConfigurationKey])
          })
          var url = `/service/v1/project-template/${projectTemplateId}/network_configuration?user_id=${service.loggedInUser.id}`
          $http.put(url, networkConfigurationsArray)
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
            // associate selected tags to child plan
            planOptions.tagMapping = {
              global: [],
              linkTags: {
                geographyTag: 'service_area',
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
        global: [],
        linkTags: {
          geographyTag: 'service_area',
          serviceAreaIds: []
        }
      }

      newPlan.tagMapping.global = service.currentPlanTags.map(tag => tag.id)
      newPlan.tagMapping.linkTags.serviceAreaIds = service.currentPlanServiceAreaTags.map(tag => tag.id)
      // newPlan.tagMapping = {"global":service.currentPlanTags.map(tag => tag.id)}
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
          return service.setPlan(plan) // This will also create overlay, tiles, etc.
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
          service.requestCreateMapOverlay.next(null) // Create a new one
          service.mapLayers.next(service.mapLayers.getValue()) // Reset map layers so that the new overlay picks them up
          service.requestMapLayerRefresh.next(null) // Redraw map layers
        })
        .catch((err) => console.error(err))
    }

    service.setPlan = (plan) => {
      service.plan.next(plan)
      service.planOptimization.next(plan)

      service.currentPlanTags = service.listOfTags.filter(tag => _.contains(plan.tagMapping.global, tag.id))
      service.currentPlanServiceAreaTags = service.listOfServiceAreaTags.filter(tag => _.contains(plan.tagMapping.linkTags.serviceAreaIds, tag.id))

      service.setPlanRedux(plan)

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
          stateSerializationHelper.loadStateFromJSON(service, service.getDispatchers(), planInputs)
          return Promise.all([
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
      promises.push($http.get(`/service/plan-library-feature-mods/${planId}/equipment?userId=${service.loggedInUser.id}`)
        .then((result) => {
          result.data.forEach((feature) => tileDataService.addModifiedFeature(feature))
        })
        .catch((err) => console.error(err))
      )

      promises.push($http.get(`/service/plan-library-feature-mods/${planId}/equipment_boundary?userId=${service.loggedInUser.id}`)
        .then((result) => {
          result.data.forEach((feature) => tileDataService.addModifiedBoundary(feature))
        })
        .catch((err) => console.error(err))
      )

      return Promise.all(promises)
    }

    service.locationInputSelected = (locationKey) => {
      return service.locationLayers.filter((locationType) => {
        return locationType.checked && locationType.categoryKey === locationKey
      }).length > 0
    }

    service.networkNodeTypesEntity = {}
    service.networkNodeTypes = {}
    // Load NetworkNodeTypesEntity
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
    service.progressMessagePollingInterval = null
    service.progressMessage = ''
    service.progressPercent = 0
    service.isCanceling = false // True when we have requested the server to cancel a request
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
                        .then(() => { return resolve() })
                    }
                  })
              })
            } else if (result === service.modifyDialogResult.OVERWRITE) {
              return service.copyCurrentPlanTo(currentPlan.name)
                .then(() => {
                  return $http.delete(`/service/v1/plan/${currentPlan.id}?user_id=${service.loggedInUser.id}`)
                    .then(() => {
                      service.selectedDisplayMode.next(service.displayModes.ANALYSIS)
                      return resolve()
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

    var checkToDisplayPopup = function () {
      return new Promise((resolve, reject) => {
        var locationLayers = angular.copy(service.locationLayers)
        var isHouseholdSelected = locationLayers.filter((locationType) => locationType.key === 'household')[0].checked

        if (isHouseholdSelected && service.optimizationOptions.networkConstraints.routingMode == service.routingModes.DIRECT_ROUTING.id) {
          swal({
            title: '',
            text: 'Are you sure you wish to proceed with direct routing given that households are selected?',
            type: 'warning',
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'Yes',
            showCancelButton: true,
            cancelButtonText: 'No',
            closeOnConfirm: true
          }, (confirmClicked) => {
            resolve(confirmClicked)
          })
        } else {
          resolve(true)
        }
      })
    }

    service.runOptimization = () => {
      checkToDisplayPopup()
        .then((result) => {
          if (result) {
            tileDataService.markHtmlCacheDirty()
            service.requestMapLayerRefresh.next(null)

            // Get the optimization options that we will pass to the server
            var optimizationBody = service.getOptimizationBody()
            // Make the API call that starts optimization calculations on aro-service
            var apiUrl = (service.networkAnalysisType.type === 'NETWORK_ANALYSIS') ? '/service/v1/analyze/masterplan' : '/service/v1/optimize/masterplan'
            apiUrl += `?userId=${service.loggedInUser.id}`
          $http.post(apiUrl, optimizationBody)
              .then((response) => {
                if (response.status >= 200 && response.status <= 299) {
                  service.Optimizingplan.optimizationId = response.data.optimizationIdentifier
                  // service.startPolling()
                  service.Optimizingplan.planState = Constants.PLAN_STATE.STARTED
                  service.progressPercent = 0
                  service.startProgressMessagePolling(response.data.startDate)
                  service.getOptimizationProgress(service.Optimizingplan)
                  service.setActivePlanState(PlanStates.START_STATE)
                } else {
                  console.error(response)
                }
              })
          } else {

          }
        })
    }

    service.planOptimization = new Rx.BehaviorSubject(null)
    service.getOptimizationProgress = (newPlan) => {
      service.Optimizingplan = newPlan
      if (service.Optimizingplan && service.Optimizingplan.planState !== PlanStates.COMPLETED) {
        SocketManager.subscribe('PROGRESS_MESSAGE_DATA', progressData => {
          if (progressData.data.processType === 'optimization') {
            newPlan.planState = progressData.data.optimizationState
            service.Optimizingplan.planState = progressData.data.optimizationState

            if (progressData.data.optimizationState === PlanStates.COMPLETED ||
              progressData.data.optimizationState === PlanStates.CANCELED ||
              progressData.data.optimizationState === PlanStates.FAILED) {
              tileDataService.markHtmlCacheDirty()
              service.requestMapLayerRefresh.next(null)
              delete service.Optimizingplan.optimizationId
              service.loadPlanInputs(newPlan.id)
              service.setActivePlanState(progressData.data.optimizationState)
              service.stopProgressMessagePolling()
            }

            service.planOptimization.next(newPlan)
            service.progressPercent = progressData.data.progress * 100
            $timeout() // Trigger a digest cycle so that components can update
          }
        })
      }
    }

    service.cancelOptimization = () => {
      service.isCanceling = true
      $http.delete(`/service/optimization/processes/${service.Optimizingplan.optimizationId}`)
        .then((response) => {
          // Optimization process was cancelled. Get the plan status from the server
          return $http.get(`/service/v1/plan/${service.Optimizingplan.id}?user_id=${service.loggedInUser.id}`)
        })
        .then((response) => {
          service.isCanceling = false
          service.Optimizingplan.planState = response.data.planState // Note that this should match with Constants.PLAN_STATE
          delete service.Optimizingplan.optimizationId
          tileDataService.markHtmlCacheDirty()
          service.requestMapLayerRefresh.next(null)
        })
        .catch((err) => {
          console.error(err)
          service.isCanceling = false
        })
    }

    service.startProgressMessagePolling = (startDate) => {
      service.progressMessagePollingInterval = setInterval(() => {
        var diff = (Date.now() - new Date(startDate).getTime()) / 1000
        var minutes = Math.floor(diff / 60)
        var seconds = Math.ceil(diff % 60)
        service.progressMessage = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds} Runtime`
        $timeout()
      },1000)
    }

    service.stopProgressMessagePolling = () => {
      if (service.progressMessagePollingInterval) {
        clearInterval(service.progressMessagePollingInterval)
        service.progressMessagePollingInterval = null
        service.progressMessage = ''
      }
    }

    service.plan.subscribe((newPlan) => {
      service.getOptimizationProgress(newPlan)
    })

    service.getDefaultPlanInputs = () => {
      return angular.copy(service.configuration.optimizationOptions)
    }

    service.showDirectedCable = false
    //service.boundaryTypes = []
    //service.selectedBoundaryType = {}

    var loadCensusCatData = function () {
      return $http.get(`/service/tag-mapping/meta-data/census_block/categories`)
        .then((result) => {
          let censusCats = {}
          result.data.forEach((cat) => {
            let tagsById = {}
            cat.tags.forEach((tag) => {
              tag.colourHash = service.StateViewMode.getTagColour(tag)
              tagsById[tag.id + ''] = tag
            })
            cat.tags = tagsById
            censusCats[cat.id + ''] = cat
          })
          service.reloadCensusCategories(censusCats)
        })
    }
    loadCensusCatData()

    var loadBoundaryLayers = function () {
      return $http.get(`/service/boundary_type`)
        .then((result) => {
          var boundaryTypes = result.data
          boundaryTypes.push({ id: result.data.length + 1, name: 'fiveg_coverage', description: 'Undefined' })
          boundaryTypes.sort((a, b) => a.id - b.id)
          var selectedBoundaryType = boundaryTypes[0]

          service.setBoundaryTypes(boundaryTypes)
          service.setSelectedBoundaryType(selectedBoundaryType)
        })
    }

    loadBoundaryLayers()

    service.setBoundaryTypes = function (boundaryTypes) {
      $ngRedux.dispatch({
        type: Actions.LAYERS_SET_BOUNDARY_TYPES,
        payload: new List(boundaryTypes)
      })
    }

    service.setSelectedBoundaryType = function (selectedBoundaryType) {
      $ngRedux.dispatch({
        type: Actions.LAYERS_SET_SELECTED_BOUNDARY_TYPE,
        payload: new Map(selectedBoundaryType)
      })
    }

    service.listOfTags = []
    service.currentPlanTags = []
    service.listOfServiceAreaTags = []
    service.currentPlanServiceAreaTags = []
    service.StateViewMode.loadListOfPlanTags($http, service)

    service.clearViewMode = new Rx.BehaviorSubject(false)
    service.clearEditingMode = new Rx.BehaviorSubject(false)
    service.clearToolbarActions = new Rx.BehaviorSubject(false)
    $rootScope.$on('map_tool_esc_clear_view_mode', () => {
      service.clearViewMode.next(true)
      service.clearEditingMode.next(true)
      service.clearToolbarActions.next(true)
    })

    service.flattenDeep = (arr) => {
      return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(service.flattenDeep(val)) : acc.concat(val), [])
    }

    service.isFeatureLayerOn = (categoryItemKey) => {
      var isOn = false
      if (service.networkEquipmentLayers.equipments.hasOwnProperty(categoryItemKey) &&
        service.networkEquipmentLayers.equipments[categoryItemKey].checked) {
        isOn = true
      }
      return isOn
    }

    service.isFeatureLayerOnForBoundary = (boundaryFeature) => {
      // if it doesn't have a network_node_type return TRUE
      var isOn = true
      var networkNodeType = ''
      if (boundaryFeature.network_node_type) {
        networkNodeType = boundaryFeature.network_node_type
      } else if (boundaryFeature.properties && boundaryFeature.properties.network_node_type) {
        networkNodeType = boundaryFeature.properties.network_node_type
      }
      if (networkNodeType != '') {
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
    // list of matched boundary list (ServiceAreaView/CensusBlocksEntity/AnalysisArea)
    service.entityTypeBoundaryList = []

    service.resetBoundarySearch = new Rx.BehaviorSubject(false)
    service.clearEntityTypeBoundaryList = () => {
      service.entityTypeBoundaryList = []
    }
    service.selectedBoundaryTypeforSearch = null
    
    service.authRolls = []
    service.authRollsByName = {}
    service.reloadAuthRolls = () => {
      return $http.get('/service/auth/roles')
      .then((result) => {
        service.authRolls = result.data
        service.authRollsByName = {}
        service.authRolls.forEach((authRoll) => {
          if (authRoll.hasOwnProperty('name')){
            service.authRollsByName[authRoll.name] = authRoll
          }
        })
      })
      .catch((err) => console.error(err))
    }
    service.reloadAuthRolls()
    
    service.authPermissionsByName = {}
    service.reloadAuthPermissions = () => {
      return $http.get('/service/auth/permissions')
      .then((result) => {
        service.authPermissionsByName = {}
        result.data.forEach((auth) => {
          if (auth.hasOwnProperty('name')){
            if (!auth.hasOwnProperty('permissions') && auth.hasOwnProperty('id')){
              auth.permissions = auth.id
            }
            service.authPermissionsByName[auth.name] = auth
          }
        })
      })
      .catch((err) => console.error(err))
    }
    service.reloadAuthPermissions()
    
    
    service.systemActors = [] // All the system actors (i.e. users and groups)
    service.reloadSystemActors = () => {
      var newSystemActors = []
      return $http.get('/service/auth/groups')
        .then((result) => {
          result.data.forEach((group) => {
            group.originalName = group.name
            group.type = 'group'
            // This is just horrible - get rid of this trustAsHtml asap. And no html in object properties!
            group.name = $sce.trustAsHtml(`<i class="fa fa-users" aria-hidden="true"></i> ${group.name}`)
            newSystemActors.push(group)
          })
          return $http.get('/service/auth/users')
        })
        .then((result) => {
          result.data.forEach((user) => {
            user.type = 'user'
            // This is just horrible - get rid of this trustAsHtml asap. And no html in object properties!
            user.name = $sce.trustAsHtml(`<i class="fa fa-user" aria-hidden="true"></i> ${user.firstName} ${user.lastName}`)
            newSystemActors.push(user)
          })
          service.systemActors = newSystemActors
          $timeout()
        })
        .catch((err) => console.error(err))
    }
    service.reloadSystemActors()

    // The logged in user is currently set by using the AngularJS injector in index.html
    service.loggedInUser = null
    service.setLoggedInUser = (user) => {
      tracker.trackEvent(tracker.CATEGORIES.LOGIN, tracker.ACTIONS.CLICK, 'UserID', user.id)

      // Set the logged in user in the Redux store
      service.setLoggedInUserRedux(user)

      service.equipmentLayerTypeVisibility.existing = service.configuration.networkEquipment.visibility.defaultShowExistingEquipment
      service.equipmentLayerTypeVisibility.planned = service.configuration.networkEquipment.visibility.defaultShowPlannedEquipment

      // Set the logged in user, then call all the initialization functions that depend on having a logged in user.
      service.loggedInUser = user
      
      service.loggedInUser.systemPermissions = 0
      service.loggedInUser.isAdministrator = false
      
      // Populate the group ids that this user is a part of
      service.loggedInUser.groupIds = []
      
      var aclResult = null
      $http.get(`/service/auth/acl/SYSTEM/1`)
      .then((result) => {
        aclResult = result.data
        // Get the acl entry corresponding to the currently logged in user
        var userAcl = aclResult.resourcePermissions.filter((item) => item.systemActorId === service.loggedInUser.id)[0]
        if (!!userAcl){
          service.loggedInUser.systemPermissions = userAcl.rolePermissions
        }
        return $http.get(`/service/auth/users/${service.loggedInUser.id}`)
      })
      .then((result) => {
        service.loggedInUser.groupIds = result.data.groupIds
        
        var userGroupIsAdministrator = false
        result.data.groupIds.forEach((groupId) => {
          const userGroupAcl = aclResult.resourcePermissions.filter((item) => item.systemActorId === groupId)[0]
          const thisGroupIsAdministrator = (userGroupAcl && (userGroupAcl.rolePermissions & service.authPermissionsByName['USER_ADMIN'].permissions)) > 0
          userGroupIsAdministrator |= thisGroupIsAdministrator
        })
        
        service.loggedInUser.isAdministrator = (userGroupIsAdministrator 
            || !!(service.loggedInUser.systemPermissions & service.authPermissionsByName['USER_ADMIN'].permissions))
        
      })
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
            var geocoder = new google.maps.Geocoder()
            geocoder.geocode({ 'placeId': result.data[0].value }, function (geocodeResults, status) {
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
    service.initializeApp = () => {
      // Get application configuration from the server
      $http.get('/configuration')
        .then(result => {
          service.configuration = result.data.appConfiguration
          service.googleMapsLicensing = result.data.googleMapsLicensing
          service.configuration.loadPerspective = (perspective) => {
            // If a perspective is not found, go to the default
            const defaultPerspective = service.configuration.perspectives.filter(item => item.name === 'default')[0]
            const thisPerspective = service.configuration.perspectives.filter(item => item.name === perspective)[0]
            service.configuration.perspective = thisPerspective || defaultPerspective
          }
          service.configuration.loadPerspective(result.data.user.perspective)
          service.setLoggedInUser(result.data.user)
          service.setOptimizationOptions()
          tileDataService.setLocationStateIcon(tileDataService.locationStates.LOCK_ICON_KEY, service.configuration.locationCategories.entityLockIcon)
          tileDataService.setLocationStateIcon(tileDataService.locationStates.INVALIDATED_ICON_KEY, service.configuration.locationCategories.entityInvalidatedIcon)
          SocketManager.initializeSession(result.data.sessionWebsocketId)
          service.getReleaseVersions()
          if (service.configuration.ARO_CLIENT === 'frontier') {
            heatmapOptions.selectedHeatmapOption = service.viewSetting.heatmapOptions.filter((option) => option.id === 'HEATMAP_OFF')[0]
          }
        })
        .catch(err => console.error(err))

      // Fire a redux action to get configuration for the redux side. This will result in two calls to /configuration for the time being.
      service.loadConfigurationFromServer()
      service.getStyleValues()

    }

    service.setOptimizationOptions = () => {
      service.optimizationOptions = angular.copy(service.configuration.optimizationOptions)

      // 158954857: disabling some optimization types
      service.optimizationOptions.uiAlgorithms = [
        service.OPTIMIZATION_TYPES.UNCONSTRAINED,
        // service.OPTIMIZATION_TYPES.MAX_IRR,
        service.OPTIMIZATION_TYPES.BUDGET,
        service.OPTIMIZATION_TYPES.IRR_TARGET,
        service.OPTIMIZATION_TYPES.IRR_THRESH,
        service.OPTIMIZATION_TYPES.COVERAGE
      ]

      service.optimizationOptions.uiSelectedAlgorithm = service.optimizationOptions.uiAlgorithms[0]
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

    service.deleteBadTransactionsAndCreateNew = (transactionsForPlan) => {
      // Sometimes we will get into a state where we have multiple open transactions for the same plan. Ask the
      // user whether they want to delete all and start a new transaction
      return new Promise((resolve, reject) => {
        swal({
          title: 'Multiple transactions',
          text: `There are multiple open transactions for this plan. You can only have one open transaction per plan. Delete older open transactions and start a new one?`,
          type: 'warning',
          confirmButtonColor: '#DD6B55',
          confirmButtonText: 'Yes, delete old',
          cancelButtonText: 'No',
          showCancelButton: true,
          closeOnConfirm: true
        }, (deleteOldTransactions) => {
          if (deleteOldTransactions) {
            var deletePromises = []
            transactionsForPlan.forEach(transactionForPlan => deletePromises.push($http.delete(`/service/plan-transactions/transaction/${transactionForPlan.id}`)))
            const currentPlanId = service.plan.getValue().id
            Promise.all(deletePromises)
              .then(res => $http.post(`/service/plan-transactions`, { userId: service.loggedInUser.id, planId: currentPlanId }))
              .then(res => resolve(res))
              .catch(err => reject(err))
          } else {
            reject('User does not want to delete multiple transactions')
          }
        })
      })
    }

    service.resumeOrCreateTransaction = () => {
      // Workflow:
      // 1. If we don't have any transaction for this plan, create one
      // 2. If we have multiple transactions for this plan, we are in a bad state. Ask the user if they want to delete all but one.
      // 3. If we have a transaction for this plan BUT not for the current user
      //    a. Ask if we want to steal the transaction. If yes, steal it. If not, show error message
      // 4. If we have a transaction for this plan and for this user, resume it

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
          } else if (transactionsForPlan > 1) {
            // We have multiple transactions for this plan. We should never get into this state, but can happen
            // due to race conditions, network issues, etc.
            return service.deleteBadTransactionsAndCreateNew(transactionsForPlan)
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
    
    
    service.serviceLayers = []
    service.nameToServiceLayers = {}
    service.loadServiceLayers = () => {
      $http.get('/service/odata/ServiceLayer?$select=id,name,description')
        .then((response) => {
          if (response.status >= 200 && response.status <= 299) {
            service.serviceLayers = response.data
            service.serviceLayers.forEach((layer) => {
              service.nameToServiceLayers[layer.name] = layer
            })
          }
        })
    }

    service.loadServiceLayers()

    service.executeManualPlanTargetsQuery = () => {
      var query = service.formatExpertModeQuery(service.expertMode[service.selectedExpertMode], service.expertModeScopeContext)
      // select id from aro.location_entity where data_source_id = 1 and id in
      // (239573,239586,239607,91293,91306,91328,237792,86289,86290,109232,239603,145556,145557,239604,239552)
      $http.post('/locations/getLocationIds', { query: query })
        .then((result) => {
          var plan = service.plan.getValue()

          const dispatchers = service.getDispatchers()
          if (service.selectedExpertMode === service.expertModeTypes['MANUAL_PLAN_TARGET_ENTRY'].id) {
            dispatchers.setSelectionTypeById(SelectionModes.SELECTED_LOCATIONS)
          } else {
            dispatchers.setSelectionTypeById(SelectionModes.SELECTED_AREAS)
          }

          var addPlanTargets = { locations: new Set(), serviceAreas: new Set() }
          var removePlanTargets = { locations: new Set(), serviceAreas: new Set() }
          if (service.selectedExpertMode === service.expertModeTypes['MANUAL_PLAN_TARGET_ENTRY'].id) {
            result.data.forEach((location) => {
              if (service.reduxPlanTargets.locations.has(+location)) {
                removePlanTargets.locations.add(+location)
              } else {
                addPlanTargets.locations.add(+location)
              }
            })
          } else {
            result.data.forEach((serviceAreaId) => {
              if (service.reduxPlanTargets.serviceAreas.has(+serviceAreaId)) {
                removePlanTargets.serviceAreas.add(+serviceAreaId)
              } else {
                addPlanTargets.serviceAreas.add(+serviceAreaId)
              }
            })
          }
          if (addPlanTargets.locations.size > 0 || addPlanTargets.serviceAreas.size > 0) {
            dispatchers.addPlanTargets(plan.id, addPlanTargets)
          }
          if (removePlanTargets.locations.size > 0 || removePlanTargets.serviceAreas.size > 0) {
            dispatchers.removePlanTargets(plan.id, removePlanTargets)
          }
        })
        .catch(err => console.log(err))
    }

    service.formatExpertModeQuery = (string, replaceWithobject) => {
      var query
      query = format(string, replaceWithobject)
      return query;
    }

    service.getValidEquipmentFeaturesList = (equipmentFeaturesList) => {
      var validEquipments = []
      equipmentFeaturesList.filter((equipment) => {
        if (tileDataService.modifiedFeatures.hasOwnProperty(equipment.object_id)) {
          if (!tileDataService.modifiedFeatures[equipment.object_id].deleted) validEquipments.push(equipment)
        } else {
          validEquipments.push(equipment)
        }
      })
      return validEquipments
    }

    service.listOfAppVersions = []
    service.getReleaseVersions = () => {
      $http.get(`/reports/releaseNotes/versions`)
        .then((result) => {
          service.listOfAppVersions = result.data.versions
          var currentuserAppVersions = localStorage.getItem(service.loggedInUser.id)

          if (!localStorage.getItem(service.loggedInUser.id) ||
            _.difference(service.listOfAppVersions, JSON.parse(currentuserAppVersions)).length > 0) {
            Notification.primary({
              message: `<a href="#" onClick="openReleaseNotes()">Latest Updates and Platform Improvements</a>`
            })
          }

          localStorage.setItem(service.loggedInUser.id, JSON.stringify(service.listOfAppVersions))
        })

      service.openReleaseNotes = () => {
        service.showGlobalSettings = true
        service.openGlobalSettingsView.next('RELEASE_NOTES')
        $timeout()
      }
    }

    service.toggleSiteBoundary = () => {
      service.updateShowSiteBoundary(!service.showSiteBoundary)
    }

    service.getDispatchers = () => {
      // So we can send dispatchers to stateSerializationHelper. This function can go away after stateSerializationHelper is refactored.
      return {
        setSelectionTypeById: service.setSelectionTypeById,
        addPlanTargets: service.addPlanTargets,
        removePlanTargets: service.removePlanTargets
      }
    }

    service.handleTileInvalidationMessage = msg => {
      // First, mark the HTML cache so we know which tiles are invalidated
      tileDataService.displayInvalidatedTiles(msg.payload.tileBox)

      // Then delete items from the tile data cache and the tile provider cache
      tileDataService.clearCacheInTileBox(msg.payload.layerNames, msg.payload.tileBox)

      // Refresh map layers
      service.requestMapLayerRefresh.next(null)
    }
    service.unsubscribeTileInvalidationHandler = SocketManager.subscribe('TILES_INVALIDATED', service.handleTileInvalidationMessage.bind(service))

    return service
  }

  mapStateToThis(reduxState) {
    return {
      locationLayers: getLocationLayersList(reduxState),
      networkEquipmentLayers: getNetworkEquipmentLayersList(reduxState),
      boundaries: getBoundaryLayersList(reduxState),
      reduxPlanTargets: reduxState.selection.planTargets,
      showSiteBoundary: reduxState.mapLayers.showSiteBoundary,
      boundaryTypes: getBoundaryTypesList(reduxState),
      selectedBoundaryType: getSelectedBoundaryType(reduxState)
    }
  }

  mapDispatchToTarget(dispatch) {
    return {
      loadConfigurationFromServer: () => dispatch(UiActions.loadConfigurationFromServer()),
      getStyleValues: () => dispatch(UiActions.getStyleValues()),
      setLoggedInUserRedux: loggedInUser => dispatch(UserActions.setLoggedInUser(loggedInUser)),
      setPlanRedux: plan => dispatch(PlanActions.setActivePlan(plan)),
      setSelectionTypeById: selectionTypeId => dispatch(SelectionActions.setActiveSelectionMode(selectionTypeId)),
      addPlanTargets: (planId, planTargets) => dispatch(SelectionActions.addPlanTargets(planId, planTargets)),
      removePlanTargets: (planId, planTargets) => dispatch(SelectionActions.removePlanTargets(planId, planTargets)),
      setActivePlanState: planState => dispatch(PlanActions.setActivePlanState(planState)),
      updateShowSiteBoundary: isVisible => dispatch(MapLayerActions.setShowSiteBoundary(isVisible))
    }
  }
}

State.$inject = ['$rootScope', '$http', '$document', '$timeout', '$sce', '$ngRedux', 'stateSerializationHelper', '$filter', 'tileDataService', 'Utils', 'tracker', 'Notification']

export default State
