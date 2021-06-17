import { List, Map } from 'immutable'
import { createSelector } from 'reselect'
import { formValueSelector } from 'redux-form'
import { toast } from 'react-toastify'
import format from './string-template'
import StateViewMode from './state-view-mode'
import MapLayerHelper from './map-layer-helper'
import Constants from '../components/common/constants'
import Actions from '../react/common/actions'
import GlobalSettingsActions from '../react/components/global-settings/globalsettings-action'
import UiActions from '../react/components/configuration/ui/ui-actions'
import UserActions from '../react/components/user/user-actions'
import ConfigurationActions from '../react/components/configuration/configuration-actions'
import PlanActions from '../react/components/plan/plan-actions'
import MapActions from '../react/components/map/map-actions'
import MapLayerActions from '../react/components/map-layers/map-layer-actions'
import MapReportsActions from '../react/components/map-reports/map-reports-actions'
import SelectionActions from '../react/components/selection/selection-actions'
import PlanStates from '../react/components/plan/plan-states'
import SelectionModes from '../react/components/selection/selection-modes'
import SocketManager from '../react/common/socket-manager'
import RingEditActions from '../react/components/ring-edit/ring-edit-actions'
import NetworkAnalysisActions from '../react/components/optimization/network-analysis/network-analysis-actions'
import NotificationInterface from '../react/components/notification/notification-interface'
import ReactComponentConstants from '../react/common/constants'
import AroNetworkConstraints from '../shared-utils/aro-network-constraints'
import PuppeteerMessages from '../components/common/puppeteer-messages'
import NetworkOptimizationActions from '../react/components/optimization/network-optimization/network-optimization-actions'
import ViewSettingsActions from '../react/components/view-settings/view-settings-actions'
import ToolBarActions from '../react/components/header/tool-bar-actions'
import RoicReportsActions from '../react/components/sidebar/analysis/roic-reports/roic-reports-actions'
import { hsvToRgb } from '../react/common/view-utils'
import StateViewModeActions from '../react/components/state-view-mode/state-view-mode-actions'

const networkAnalysisConstraintsSelector = formValueSelector(ReactComponentConstants.NETWORK_ANALYSIS_CONSTRAINTS)

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllLocationLayers = reduxState => reduxState.mapLayers.location
const getLocationLayersList = createSelector([getAllLocationLayers], (locationLayers) => locationLayers.toJS())

const getAllNetworkEquipmentLayers = reduxState => reduxState.mapLayers.networkEquipment
const getNetworkEquipmentLayersList = createSelector([getAllNetworkEquipmentLayers], (networkEquipmentLayers) => networkEquipmentLayers)

const getAllBoundaryLayers = reduxState => reduxState.mapLayers.boundary
// FIXME: change boundaries to an array so it doesn't change w/ each `.toJS()`
const getBoundaryLayersList = createSelector([getAllBoundaryLayers], (boundaries) => boundaries.toJS())

const getAllBoundaryTypesList = reduxState => reduxState.mapLayers.boundaryTypes
const getBoundaryTypesList = createSelector([getAllBoundaryTypesList], (boundaryTypes) => boundaryTypes.toJS())

/* global app localStorage map */
class State {
  constructor ($rootScope, $http, $document, $timeout, $sce, $ngRedux, $filter, tileDataService, Utils, tracker, Notification, rxState) {
    // Important: RxJS must have been included using browserify before this point
    var Rx = require('rxjs')

    var service = {}
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

    service.cashFlowStrategyTypes = {
      COMPUTED_ROIC: { id: 'COMPUTED_ROIC', label: 'Computed ROIC' },
      ESTIMATED_ROIC: { id: 'ESTIMATED_ROIC', label: 'Estimated ROIC' },
      EXTERNAL: { id: 'EXTERNAL', label: 'External' }
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

    // ToDo: move this to redux state: optimize
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
        service.setGoogleMapsReference(map)
        service.updateDefaultPlanCoordinates(map) // To set map Coordinates to plan-action redux
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
    service.cableLayerTypeVisibility = {
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
      PLAN_SUMMARY: 'PLAN_SUMMARY',
      EDIT_RINGS: 'EDIT_RINGS'
    })
    service.activeEditPlanPanel = service.EditPlanPanels.EDIT_PLAN
    
    service.EditRingsPanels = Object.freeze({
      EDIT_RINGS: 'EDIT_RINGS',
      OUTPUT: 'OUTPUT'
    })
    service.activeEditRingsPanel = service.EditRingsPanels.EDIT_RINGS

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
    service.isReportMode = false

    // Boundary Layer Mode
    service.boundaryLayerMode = Object.freeze({
      VIEW: 'VIEW',
      SEARCH: 'SEARCH'
    })

    service.activeboundaryLayerMode = service.boundaryLayerMode.SEARCH

    // Map layers data - define once. Details on map layer objects are available in the TileComponentController class in tile-component.js
    service.mapLayers = new Rx.BehaviorSubject({})
    /*
    service.setUseHeatMap = (useHeatMap) => {
      // ToDo: don't hardcode these, but this whole thing needs to be restructured
      //   below is duplicate of object in rxState.js
      var newMapTileOptions = {
        showTileExtents: false,
        heatMap: {
          useAbsoluteMax: false,
          maxValue: 100,
          powerExponent: 0.5,
          worldMaxValue: 500000
        },
        selectedHeatmapOption: viewSetting.heatmapOptions[0]
      }
      
      newMapTileOptions.selectedHeatmapOption = useHeatMap ? service.viewSetting.heatmapOptions[0] : service.viewSetting.heatmapOptions[2] 
      rxState.mapTileOptions.sendMessage(newMapTileOptions)
    }
    */
    service.defaultPlanCoordinates = {
      zoom: 14,
      latitude: 47.6062, // Seattle, WA by default. For no particular reason.
      longitude: -122.3321, // Seattle, WA by default. For no particular reason.
      areaName: 'Seattle, WA' // Seattle, WA by default. For no particular reason.
    }
    service.requestMapLayerRefresh = new Rx.BehaviorSubject({})
    service.requestCreateMapOverlay = new Rx.BehaviorSubject(null)
    service.requestDestroyMapOverlay = new Rx.BehaviorSubject(null)
    service.showNetworkAnalysisOutput = false
    service.networkPlanModal = new Rx.BehaviorSubject(false)
    service.planInputsModal = new Rx.BehaviorSubject(false)
    service.requestSetMapCenter = new Rx.BehaviorSubject({ latitude: service.defaultPlanCoordinates.latitude, longitude: service.defaultPlanCoordinates.longitude })
    service.requestSetMapZoom = new Rx.BehaviorSubject(service.defaultPlanCoordinates.zoom)
    service.showDetailedLocationInfo = new Rx.BehaviorSubject()
    service.showDetailedEquipmentInfo = new Rx.BehaviorSubject()
    service.showDataSourceUploadModal = new Rx.BehaviorSubject(false)
    service.showProjectSettingsModal = false
    service.selectedDataTypeId = 1
    service.viewSettingsChanged = new Rx.BehaviorSubject()
    service.measuredDistance = new Rx.BehaviorSubject()
    service.dragStartEvent = new Rx.BehaviorSubject()
    service.dragEndEvent = new Rx.BehaviorSubject()
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

    // Raise an event requesting locations within a polygon to be selected. Coordinates are relative to the visible map.
    service.requestPolygonSelect = new Rx.BehaviorSubject({})

    service.areTilesRendering = false
    service.noteIdTilesRendering = null
    service.setAreTilesRendering = newValue => {
      // can't use the proper notification system because
      //  this function is run at least once per second
      //  for the life of the app. Fix this.
      /*
      if (!newValue && service.areTilesRendering) { // set to off and not off
        console.log('---------------------------- OFF -------')
        service.noteIdTilesRendering = service.removeNotification(service.noteIdTilesRendering)
      } else if (newValue && !service.areTilesRendering) { // set to on and not already on
        console.log('---------------------------- ON --------')
        service.noteIdTilesRendering = service.postNotification('Rendering Tiles')
      }
      */
      service.areTilesRendering = newValue
      $timeout()
    }

    service.angBoundaries = new Rx.BehaviorSubject()
    service.layerCategories = new Rx.BehaviorSubject()

    // The display modes for the application
    service.displayModes = Object.freeze({
      VIEW: 'VIEW',
      ANALYSIS: 'ANALYSIS',
      EDIT_RINGS: 'EDIT_RINGS',
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
    
    // feature clicked on map
    service.hackRaiseEvent = (features) => {
      $rootScope.$broadcast('map_layer_clicked_feature', features, {})
    }
    service.mapFeaturesSelectedEvent = new Rx.BehaviorSubject({})
    service.mapFeaturesRightClickedEvent = new Rx.BehaviorSubject({})
    service.mapFeaturesKeyClickedEvent = new Rx.BehaviorSubject({})
    service.mapFeaturesClickedEvent = new Rx.BehaviorSubject({})

    service.mapFeaturesSelectedEvent.skip(1).subscribe((options) => {

      // set all mapFeatures in redux
      if (service.selectedDisplayMode.getValue() == service.displayModes.VIEW) {
        service.setMapFeatures(options)
      }

      // ToDo: this check may need to move into REACT
      if (service.selectedDisplayMode.getValue() == service.displayModes.EDIT_RINGS
        && service.activeEditRingsPanel == service.EditRingsPanels.EDIT_RINGS) {
        service.onFeatureSelectedRedux(options)
      } else if (options.locations) {
        service.setSelectedLocations(options.locations.map(location => location.location_id))
      }
    })

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
        layerCategoryId: null,
        roadSegments: new Set(),
        serviceAreaId: null,
        fiberSegments: new Set(),
        siteBoundaryId: null
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
    service.plan = null
    service.planChanged = new Rx.BehaviorSubject(null)

    // Initialize the state of the application (the parts that depend upon configuration being loaded from the server)
    service.initializeState = function () {
      service.reloadLocationTypes()
      // service.selectedDisplayMode.next(service.displayModes.VIEW)
      service.setSelectedDisplayMode(service.displayModes.VIEW)

      // Upload Data Sources
      service.uploadDataSources = []
      service.pristineDataItems = {}
      service.dataItems = {}
    }

    // we still need this for the location.checked = location.initiallySelected bit
    //  until we redo the location sub-type/filter system
    service.reloadLocationTypes = () => {
      var locationTypesForRedux = List()
      var locations = service.configuration.locationCategories.categories
      var uiLayerId = 0
      Object.keys(locations).forEach((locationKey) => {
        var location = locations[locationKey]

        if (service.configuration.perspective.visibleLocationCategories.indexOf(locationKey) >= 0) {
          location.checked = location.initiallySelected
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

    service.getVisibleAnalysisLayers = () => $ngRedux.getState().mapLayers.boundary.filter(item => item.checked && (item.key === 'analysis_layer'))

    // Get a POST body that we will send to aro-service for performing optimization
    // Optimization options in Redux
    // ToDo:
    // service.optimizationInputs is now from Redux
    //  but we should replace the use of this function with a redux selector
    service.getOptimizationBody = () => {
      var inputs = JSON.parse(JSON.stringify(service.optimizationInputs))
      // inputs.analysis_type = service.networkAnalysisTypeId
      // inputs.planId = service.planId
      inputs.planId = service.plan.id
      inputs.locationConstraints = {}
      inputs.locationConstraints.analysisSelectionMode = service.activeSelectionModeId
      inputs.locationConstraints.locationTypes = []
      service.locationLayers.forEach(locationsLayer => {
        if (locationsLayer.checked) inputs.locationConstraints.locationTypes.push(locationsLayer.plannerKey)
      })
      
      return inputs
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

    // Shows the modal for editing plan resources
    service.showPlanResourceEditor = (resourceKey) => {
      service.editingPlanResourceKey = resourceKey
      service.showPlanResourceEditorModal = true
    }

    // not quite sure where to put the defaults
    service.resourceItems = {}
    // Load the plan resource selections from the server
    service.loadPlanResourceSelectionFromServer = () => {
      if (!service.plan) {
        return Promise.resolve()
      }
      var currentPlan = service.plan
      return Promise.all([
        $http.get('/service/odata/resourcetypeentity'), // The types of resource managers
        $http.get('/service/v2/resource-manager'),
        $http.get(`/service/v1/plan/${currentPlan.id}/configuration`)
      ])
        .then((results) => {
          var resourceManagerTypes = results[0].data
          var allResourceManagers = results[1].data
          var selectedResourceManagers = results[2].data.resourceConfigItems

          var resourceManOrder = [
            'price_book',
            'arpu_manager',
            'roic_manager',
            'rate_reach_manager',
            'impedance_mapping_manager',
            'tsm_manager',
            'competition_manager',
            'fusion_manager',
            'network_architecture_manager',
            'planning_constraints_manager'
          ]

          // First set up the resource items so that we display all types in the UI
          var newResourceItems = {}
          resourceManagerTypes.forEach((resourceManager) => {
            if (!resourceManOrder.includes(resourceManager.name)) resourceManOrder.push(resourceManager.name)

            newResourceItems[resourceManager.name] = {
              id: resourceManager.id,
              description: resourceManager.description,
              allManagers: [],
              selectedManager: null,
              order: resourceManOrder.indexOf(resourceManager.name)
            }
          })

          // Then add all the managers in the system to the appropriate type
          allResourceManagers.forEach((resourceManager) => {
            // Once the backend supports the permission filtering on the odata API
            // or durinng the react migration  managerType - resourceType maping can 
            // be removed as managerType is used in many old Angular code
            resourceManager['managerType'] = resourceManager['resourceType']
            delete resourceManager['resourceType']
            if (!resourceManager.deleted) {
              newResourceItems[resourceManager.managerType].allManagers.push(resourceManager)
            }
            newResourceItems[resourceManager.managerType].allManagers.sort((a, b) => (a.name > b.name) ? 1 : -1)
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
        .catch((err) => console.error(err))
    }

    service.getDefaultProjectForUser = (userId) => {
      return $http.get(`/service/auth/users/${userId}/configuration`)
        .then((result) => Promise.resolve(result.data.projectTemplateId))
        .catch((err) => console.error(err))
    }

    // Get the default project template id for a given user
    service.getDefaultProjectTemplate = (userId) => {
      return $http.get(`/service/auth/users/${service.loggedInUser.id}/configuration`)
        .then((result) => Promise.resolve(result.data.projectTemplateId))
        .catch((err) => console.error(err))
    }

    service.createNewPlan = (isEphemeral, planName, parentPlan, planType) => {
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
        name: planName || 'Untitled', 
        planType: planType || 'UNDEFINED'
      }
      return service.getAddressFor(planOptions.latitude, planOptions.longitude)
        .then((address) => {
          planOptions.areaName = address
          // Get the configuration for this user - this will contain the default project template to use
          return $http.get(`/service/auth/users/${service.loggedInUser.id}/configuration`)
        })
        .then((result) => {
          var apiEndpoint = `/service/v1/plan?project_template_id=${result.data.projectTemplateId}`
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
      return $http.get(`/service/v1/plan/ephemeral/latest`)
        .then((result) => {
          // We have a valid ephemeral plan if we get back an object with *some* properties
          // When there is no plan API return empty string instead of empty object, Hence this method Object.getOwnPropertyNames(result.data).length always return 1
          var isValidEphemeralPlan = result.data ? true : false
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

    service.makeCurrentPlanNonEphemeral = (planName, planType) => {
      var newPlan = JSON.parse(JSON.stringify(service.plan))
      newPlan.name = planName
      newPlan.ephemeral = false
      newPlan.latitude = service.defaultPlanCoordinates.latitude
      newPlan.longitude = service.defaultPlanCoordinates.longitude
      newPlan.planType = planType || 'UNDEFINED'
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
          return $http.put(`/service/v1/plan`, newPlan)
        })
        .then((result) => {
          if (result.status >= 200 && result.status <= 299) {
            // Plan has been saved in the DB. Reload it
            service.setPlanRedux(result.data)
          } else {
            console.error('Unable to make plan permanent')
            console.error(result)
          }
        })
    }

    service.copyCurrentPlanTo = (planName, planType) => {
      var newPlan = JSON.parse(JSON.stringify(service.plan))
      newPlan.name = planName
      newPlan.ephemeral = false

      // Only keep the properties needed to create a plan
      var validProperties = new Set(['projectId', 'areaName', 'latitude', 'longitude', 'ephemeral', 'name', 'zoomIndex', 'planType'])
      var keysInPlan = Object.keys(newPlan)
      keysInPlan.forEach((key) => {
        if (!validProperties.has(key)) {
          delete newPlan[key]
        }
      })
      var userId = service.loggedInUser.id
      var url = `/service/v1/plan-command/copy?source_plan_id=${service.plan.id}&is_ephemeral=${newPlan.ephemeral}&name=${newPlan.name}`

      return $http.post(url, {})
        .then((result) => {
          if (result.status >= 200 && result.status <= 299) {
            var center = map.getCenter()
            result.data.latitude = center.lat()
            result.data.longitude = center.lng()
            result.data.planType = planType || 'UNDEFINED'
            return $http.put(`/service/v1/plan`, result.data)
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
      // service.selectedDisplayMode.next(service.displayModes.VIEW)
      service.setSelectedDisplayMode(service.displayModes.VIEW)
      var plan = null
      return $http.get(`/service/v1/plan/${planId}`)
        .then((result) => {
          plan = result.data
          return service.getAddressFor(plan.latitude, plan.longitude)
        })
        .then((address) => {
          plan.areaName = address
          service.requestSetMapCenter.next({ latitude: plan.latitude, longitude: plan.longitude })
          service.requestSetMapZoom.next(plan.zoomIndex)
          return Promise.resolve()
        })
        .then(() => {
          return service.setPlanRedux(plan) // This will also create overlay, tiles, etc.
        })
    }

    // The Nuclear option - Delete the tile data and HTML elements cache and force Google Maps to call
    // our getTile() method again. Any rendering that is in process for the existing tiles will
    // continue but will not be shown on our map.
    service.recreateTilesAndCache = () => {
      tileDataService.clearDataCache()
      tileDataService.clearHtmlCache()
      return service.loadModifiedFeatures(service.plan.id)
        .then(() => {
          service.requestDestroyMapOverlay.next(null) // Destroy the old map overlay (may not exist if we have just loaded a plan)
          service.requestCreateMapOverlay.next(null) // Create a new one
          service.mapLayers.next(service.mapLayers.getValue()) // Reset map layers so that the new overlay picks them up
          service.requestMapLayerRefresh.next(null) // Redraw map layers
        })
        .catch((err) => console.error(err))
    }

    service.onActivePlanChanged = () => {
      service.planChanged.next(null)
      service.currentPlanTags = service.listOfTags.filter(tag => _.contains(service.plan.tagMapping.global, tag.id))
      service.currentPlanServiceAreaTags = service.listOfServiceAreaTags.filter(tag => _.contains(service.plan.tagMapping.linkTags.serviceAreaIds, tag.id))

      // Logic for setting plan center in different scenarios:
      // 1. The user logs in to the app from the login page: User will be in ephemeral plan, use the default plan location for the user.
      // 2. The user refreshes the browser when in a saved plan: User will be in ephemeral plan, use the default plan location for the user.
      // 3. The user refreshes the browser when in an ephemeral plan: User will be in ephemeral plan, use the default plan location for the user.
      // 4. The user creates a new ephemeral plan: Map should remain where it is (no pan, no zoom)
      // 5. The user opens a saved plan: The plan location saved in the plan.

      return service.loadPlanInputs(service.plan.id)
        .then(() => {
          const planCoordinates = service.plan.ephemeral ? service.defaultPlanCoordinates : { latitude: service.plan.latitude, longitude: service.plan.longitude }
          if (!service.isReportMode) {
            service.requestSetMapCenter.next({
              latitude: planCoordinates.latitude || service.defaultPlanCoordinates.latitude,
              longitude: planCoordinates.longitude || service.defaultPlanCoordinates.longitude
            })
            service.requestSetMapZoom.next(service.plan.zoomIndex || service.defaultPlanCoordinates.zoom)
          }
          service.recreateTilesAndCache()
        })
        .catch((err) => console.error(err))
    }

    // Load the plan inputs for the given plan and populate them in state
    // Optimization options in Redux
    // ToDo: depricate loadPlanInputs, replace with redux store
    service.loadPlanInputs = (planId) => {
      return $http.get(`/service/v1/plan/${planId}/inputs`)
        .then((result) => {
          var defaultPlanInputs = service.getDefaultPlanInputs()
          var planInputs = Object.keys(result.data).length > 0 ? result.data : defaultPlanInputs

          // OK, this is kind of a mess. We have a lot of semi-depricated code that we are clearing out
          //    that depends on depricated planInputs schema.
          //    for the moment we'll merge with default to avoid crashes.
          //    i know it's not the best, I'll be back.
          planInputs = { ...defaultPlanInputs, ...planInputs }
          return Promise.all([
            service.loadPlanResourceSelectionFromServer() // ,
            // service.loadNetworkConfigurationFromServer()
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
      CANCEL: 0,
      OVERWRITE: 1
    })
    service.progressMessagePollingInterval = null
    service.progressMessage = ''
    service.progressPercent = 0
    service.isCanceling = false // True when we have requested the server to cancel a request

    // expert mode refactor
    // also used by ring edit and r-network-optimization-input
    service.handleModifyClicked = () => {
      var currentPlan = service.plan
      if (currentPlan.ephemeral) {
        // This is an ephemeral plan. Don't show any dialogs to the user, simply copy this plan over to a new ephemeral plan
        var url = `/service/v1/plan-command/copy?source_plan_id=${currentPlan.id}&is_ephemeral=${currentPlan.ephemeral}`
        return $http.post(url, {})
          .then((result) => {
            if (result.status >= 200 && result.status <= 299) {
              service.setPlanRedux(result.data, true)
              return Promise.resolve()
            }
          })
          .catch((err) => {
            console.log(err)
            return Promise.reject(err)
          })
      } else {
        // This is not an ephemeral plan. Show a dialog to the user asking whether to overwrite current plan or save as a new one.
        return service.showModifyQuestionDialog()
          .then((result) => {
            if (result === service.modifyDialogResult.OVERWRITE) {
              return $http.delete(`/service/v1/plan/${currentPlan.id}/optimization-state`)
                .then(() => $http.get(`/service/v1/plan/${currentPlan.id}/optimization-state`))
                .then(result => {
                  service.plan.planState = result.data
                  service.setActivePlanState(result.data)
                  $timeout()
                })
                .catch(err => console.error(err))
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
          text: 'You are modifying a plan with a completed analysis. Do you wish to overwrite the existing plan?  Overwriting will clear all results which were previously run.',
          type: 'info',
          confirmButtonColor: '#b9b9b9',
          confirmButtonText: 'Overwrite',
          cancelButtonColor: '#DD6B55',
          cancelButtonText: 'Cancel',
          showCancelButton: true,
          closeOnConfirm: true
        }, (wasConfirmClicked) => {
          resolve(wasConfirmClicked ? service.modifyDialogResult.OVERWRITE : service.modifyDialogResult.CANCEL)
        })
      })
    }

    service.getOptimizationProgress = (newPlan) => {
      if (!service.plan.planState) {
        service.plan.planState = PlanStates.START_STATE
        service.setActivePlanState(PlanStates.START_STATE)
      }
      if (service.plan) {
        // Unsubscribe from progress message handler (if any)
        if (service.unsubscribeProgressHandler) {
          service.unsubscribeProgressHandler()
        }
        service.unsubscribeProgressHandler = SocketManager.subscribe('PROGRESS_MESSAGE_DATA', msg => {
          if (msg.data.processType === 'optimization') {
            const state = msg.data.optimizationState
            newPlan.planState = state
            service.plan.planState = state

            if (state === PlanStates.CANCELED || state === PlanStates.FAILED) {
              tileDataService.markHtmlCacheDirty()
              service.requestMapLayerRefresh.next(null)
              delete service.plan.optimizationId
              service.loadPlanInputs(newPlan.id)
              service.setActivePlanState(state)
              service.stopProgressMessagePolling()
            }

            service.progressPercent = msg.data.progress * 100
            $timeout() // Trigger a digest cycle so that components can update
          }
        })
      }
    }

    // ToDo: move to redux
    service.cancelOptimization = () => {
      service.isCanceling = true
      $http.delete(`/service/optimization/processes/${service.plan.optimizationId}`)
        .then((response) => {
          // Optimization process was cancelled. Get the plan status from the server
          return $http.get(`/service/v1/plan/${service.plan.id}`)
        })
        .then((response) => {
          service.isCanceling = false
          service.plan.planState = response.data.planState // Note that this should match with Constants.PLAN_STATE
          delete service.plan.optimizationId
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
      }, 1000)
    }

    service.stopProgressMessagePolling = () => {
      if (service.progressMessagePollingInterval) {
        clearInterval(service.progressMessagePollingInterval)
        service.progressMessagePollingInterval = null
        service.progressMessage = ''
      }
    }

    service.getDefaultPlanInputs = () => {
      return angular.copy(service.configuration.optimizationOptions)
    }

    service.showDirectedCable = false

    var loadBoundaryTypes = function () {
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
    loadBoundaryTypes()

    service.setBoundaryTypes = function (boundaryTypes) {
      $ngRedux.dispatch({
        type: Actions.LAYERS_SET_BOUNDARY_TYPES,
        payload: new List(boundaryTypes)
      })
    }

    service.setSelectedBoundaryType = function (selectedBoundaryType) {
      $ngRedux.dispatch({
        type: Actions.LAYERS_SET_SELECTED_BOUNDARY_TYPE,
        payload: selectedBoundaryType
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
      // To clear the values for view mode React components using Redux.
      service.rClearViewMode(true)
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
            if (authRoll.hasOwnProperty('name')) {
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
            if (auth.hasOwnProperty('name')) {
              if (!auth.hasOwnProperty('permissions') && auth.hasOwnProperty('id')) {
                auth.permissions = auth.id
              }
              service.authPermissionsByName[auth.name] = auth
            }
          })
        })
        .catch((err) => console.error(err))
    }
    service.reloadAuthPermissions()

    // service.systemActors
    
    // The logged in user is currently set by using the AngularJS injector in index.html
    service.loggedInUser = null
    service.setLoggedInUser = (user, initialState) => {
      tracker.trackEvent(tracker.CATEGORIES.LOGIN, tracker.ACTIONS.CLICK, 'UserID', user.id)

      if (initialState.reportPage && initialState.reportPage.locationFilters) {
        service.setLocationFilters(initialState.reportPage.locationFilters)
      }
      // Set the logged in user in the Redux store
      service.loadAuthPermissionsRedux()
      service.loadAuthRolesRedux()
      service.setLoggedInUserRedux(user)
      service.loadSystemActorsRedux()
      SocketManager.joinRoom('user', user.id)
      // Join room for this broadcast
      SocketManager.joinRoom('broadcast', user.id)

      service.equipmentLayerTypeVisibility.existing = service.configuration.networkEquipment.visibility.defaultShowExistingEquipment
      service.equipmentLayerTypeVisibility.planned = service.configuration.networkEquipment.visibility.defaultShowPlannedEquipment
      var reduxTypeVisibility = {
        equipment: {
          existing: service.equipmentLayerTypeVisibility.existing,
          planned: service.equipmentLayerTypeVisibility.planned
        }
      }
      service.setTypeVisibility(reduxTypeVisibility)

      // Set the logged in user, then call all the initialization functions that depend on having a logged in user.
      service.loggedInUser = user

      // ToDo: LoggedInUser should be a class
      service.loggedInUser.systemPermissions = 0
      service.loggedInUser.isAdministrator = false

      // Populate the group ids that this user is a part of
      service.loggedInUser.groupIds = []

      // will check if the logged in user has a permissions level
      // either globally or on a resource
      service.loggedInUser.hasPermissions = (permissionsLevel, resourcePermissions) => {
        var hasPerms = !!(permissionsLevel & service.loggedInUser.systemPermissions)
        if (!hasPerms && 'undefined' != typeof resourcePermissions) {
          hasPerms = hasPerms || !!(permissionsLevel & resourcePermissions)
        }
        return hasPerms
      }

      var aclResult = null
      $http.get(`/service/auth/acl/SYSTEM/1`)
        .then((result) => {
          service.v2FiltersLoaded = true
          aclResult = result.data
          // Get the acl entry corresponding to the currently logged in user
          var userAcl = aclResult.resourcePermissions.filter((item) => item.systemActorId === service.loggedInUser.id)[0]
          if (!!userAcl) {
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
        service.setPlanRedux(plan)
      }
      var plan = null
      const planIdToLoad = (initialState.reportPage && initialState.reportPage.planId) || (initialState.reportOverview && initialState.reportOverview.planId)
      const planPromise = planIdToLoad ? $http.get(`/service/v1/plan/${planIdToLoad}`) : service.getOrCreateEphemeralPlan()
      return planPromise // Will be called once when the page loads, since state.js is a service
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
          service.isReportMode = Boolean(initialState.reportPage || initialState.reportOverview)
          if (service.isReportMode) {
            // Broadcast modal interfers while downloading PDF reports with puppeteer, So 'isReportMode' is set in redux
            // to hide Broadcast modal (notify-broadcast-modal.jsx) from PDF reports.
            service.setIsReportMode(true)
            var reportOptions = initialState.reportPage || initialState.reportOverview
            return service.mapReadyPromise
              .then(() => {
                google.maps.event.addListener(map, 'tilesloaded', function () {
                  PuppeteerMessages.googleMapsTilesRenderedCallback()
                })
                // If we are in Report mode, disable the default UI like zoom buttons, etc.
                service.mapRef.setOptions({
                  disableDefaultUI: true,
                  streetViewControl: false,
                  mapTypeControl: false
                })

                // ToDo: should standardize initialState properties
                service.setShowLocationLabels(reportOptions.showLocationLabels)
                /*
                if (reportOptions.showLocationLabels) {
                  service.setUseHeatMap(!reportOptions.showLocationLabels)
                }
                */
                service.setShowEquipmentLabelsChanged(reportOptions.showEquipmentLabels)

                service.setPlanRedux(plan)
                const mapCenter = (initialState.reportPage && initialState.reportPage.mapCenter) || (initialState.reportOverview && initialState.reportOverview.mapCenter)
                const mapZoom = (initialState.reportPage && initialState.reportPage.mapZoom) || (initialState.reportOverview && initialState.reportOverview.mapZoom)
                if (mapCenter) {
                  service.requestSetMapCenter.next({ latitude: mapCenter.latitude, longitude: mapCenter.longitude })
                }
                if (mapZoom) {
                  service.requestSetMapZoom.next(mapZoom)
                }
                if (initialState.reportOverview) {
                  service.loadReportPagesForPlan(plan.id)
                  service.setMapReportMapObjectsVisibility(true)
                  service.setMapReportPageNumbersVisibility(true)
                }
                return Promise.resolve()
              })
              .catch(err => console.error(err))
          } else {
            return $http.get(`/search/addresses?text=${searchLocation}&sessionToken=${Utils.getInsecureV4UUID()}`)
          }
        })
        .then((result) => {
          if (result && result.data && result.data.length > 0 && result.data[0].type === 'placeId') {
            return new Promise((resolve, reject) => {
              var geocoder = new google.maps.Geocoder()
              geocoder.geocode({ 'placeId': result.data[0].value }, function (geocodeResults, status) {
                if (status !== 'OK') {
                  console.error('Geocoder failed: ' + status)
                  console.error('Setting map coordinates to default')
                  initializeToDefaultCoords(plan)
                  return resolve()
                }
                service.requestSetMapCenter.next({
                  latitude: geocodeResults[0].geometry.location.lat(),
                  longitude: geocodeResults[0].geometry.location.lng()
                })
                const ZOOM_FOR_OPEN_PLAN = 14
                service.requestSetMapZoom.next(ZOOM_FOR_OPEN_PLAN)
                service.setPlanRedux(plan)
                resolve()
              })
            })
          } else {
            if (!(initialState.reportPage && initialState.reportPage.mapCenter)) {  // If we have an initial state then this has alredy been set
              // Set it to the default so that the map gets initialized
              return initializeToDefaultCoords(plan)
            }
          }
        })
        .then(() => {
          if (initialState.reportPage && initialState.reportPage.visibleLayers) {
            // We have an initial state, wait for a few seconds (HACKY) and turn layers on/off as per request
            const timeoutPromise = new Promise((resolve, reject) => { setTimeout(() => resolve(), 2000) })
            return timeoutPromise
              .then(() => {
                // Set layer visibility as per the initial state
                const setOfVisibleLayers = new Set(initialState.reportPage.visibleLayers)
                service.mapLayersRedux.location.forEach(layer => {
                  const isVisible = setOfVisibleLayers.has(layer.key)
                  service.setLayerVisibility(layer, isVisible)
                })

                var layersTypeVisibility = {
                  equipment: {
                    existing: false,
                    planned: true
                  },
                  cable: {
                    existing: false,
                    planned: true
                  }
                }

                if (initialState.reportPage.layersTypeVisibility) layersTypeVisibility = initialState.reportPage.layersTypeVisibility
                service.equipmentLayerTypeVisibility.existing = layersTypeVisibility.equipment.existing
                service.equipmentLayerTypeVisibility.planned = layersTypeVisibility.equipment.planned
                service.cableLayerTypeVisibility.existing = layersTypeVisibility.cable.existing
                service.cableLayerTypeVisibility.planned = layersTypeVisibility.cable.planned
                service.setTypeVisibility(layersTypeVisibility)

                // ToDo: this should NOT be hardcoded, related to map-reports-downloader > doDownloadReport()
                var layerTypes = ['roads', 'cables', 'boundaries', 'equipments', 'conduits']
                layerTypes.forEach(layerType => {
                  Object.keys(service.mapLayersRedux.networkEquipment[layerType]).forEach(layerKey => {
                    const isVisible = setOfVisibleLayers.has(layerKey)
                    service.setNetworkEquipmentLayerVisiblity(layerType, service.mapLayersRedux.networkEquipment[layerType][layerKey], isVisible)
                  })
                })

                Object.keys(initialState.reportPage.visibleCableConduits).forEach(cableKey => {
                  var conduitVisibility = initialState.reportPage.visibleCableConduits[cableKey]
                  Object.keys(conduitVisibility).forEach(conduitKey => {
                    if (conduitVisibility[conduitKey]) {
                      service.setCableConduitVisibility(cableKey, conduitKey, true)
                    }
                  })
                })
              })
          } else {
            return Promise.resolve()
          }
        })
        .then(() => {
          console.log('No longer suppressing vector tiles')
          service.suppressVectorTiles = false
          PuppeteerMessages.suppressMessages = false
          service.recreateTilesAndCache()
          // Late night commit. The following line throws an error. Subtypes get rendered.
          //service.requestSetMapZoom.next(map.getZoom() + 1)
          $timeout()
        })
        .catch((err) => {
          console.error(err)
          // Set it to the default so that the map gets initialized
          initializeToDefaultCoords(plan)
        })
    }

    service.suppressVectorTiles = true
    service.configuration = {}
    service.initializeApp = initialState => {
      // Get application configuration from the server
      return $http.get('/configuration')
        .then(result => {
          var config = result.data

          // filter out conduits that are not to be shown
          // this code may belong in cache.js instead
          var conduits = config.appConfiguration.networkEquipment.conduits || {}
          var filteredConduits = {}
          Object.keys(conduits).forEach(type => {
            var conduit = conduits[type]
            // for backwards compatibility
            // we only filter out IF there is a .show property AND it = false
            if (!conduit.hasOwnProperty('show') || conduit.show) {
              filteredConduits[type] = conduit
            }
          })
          config.appConfiguration.networkEquipment.conduits = filteredConduits

          service.configuration = config.appConfiguration
          service.setLocationFilters(service.configuration.locationCategories.filters)
          service.googleMapsLicensing = config.googleMapsLicensing
          service.enumStrings = config.enumStrings
          service.setEnumStrings(service.enumStrings) // Require in roic-reports-small.jsx
          if (!service.enumStrings) {
            throw new Error('No enumeration strings object found. Please check your server logs for errors in the UI schema.')
            // note: if this is happening 
            //   check if the error from /aro-platform/app/helpers/ui_configuration.js is being thrown 
            //   'A client string definition was encountered, but there is no corresponding base definition. Always define the base definition'
            //   then check the ui.enum_string table
          }
          service.configuration.loadPerspective = (perspective) => {
            // If a perspective is not found, go to the default
            const defaultPerspective = service.configuration.perspectives.filter(item => item.name === 'default')[0]
            const thisPerspective = service.configuration.perspectives.filter(item => item.name === perspective)[0]
            service.configuration.perspective = thisPerspective || defaultPerspective
            service.setPerspective(service.configuration.perspective)
          }
          service.configuration.loadPerspective(config.user.perspective)
          service.setNetworkEquipmentLayers(service.configuration.networkEquipment)
          service.setCopperLayers(service.configuration.copperCategories)

          service.setAppConfiguration(service.configuration) // Require in tool-bar.jsx
          service.loadEdgeConstructionTypeIds()
          return service.setLoggedInUser(config.user, initialState)
        })
        .then(() => {
          // service.setOptimizationOptions()
          tileDataService.setLocationStateIcon(tileDataService.locationStates.LOCK_ICON_KEY, service.configuration.locationCategories.entityLockIcon)
          tileDataService.setLocationStateIcon(tileDataService.locationStates.INVALIDATED_ICON_KEY, service.configuration.locationCategories.entityInvalidatedIcon)
          if (!initialState.reportPage && !initialState.reportOverview) {
            service.getReleaseVersions()
          }
          if (service.configuration.ARO_CLIENT === 'frontier' || service.configuration.ARO_CLIENT === 'sse') {
            // heatmapOptions.selectedHeatmapOption = service.viewSetting.heatmapOptions.filter((option) => option.id === 'HEATMAP_OFF')[0]
            // To set selectedHeatmapOption to redux tool-bar for frontier Client
            service.setSelectedHeatMapOption(service.viewSetting.heatmapOptions.filter((option) => option.id === 'HEATMAP_OFF')[0].id)
          }
          service.setOptimizationInputs(service.configuration.optimizationOptions)
          // Fire a redux action to get configuration for the redux side. This will result in two calls to /configuration for the time being.
          service.getStyleValues()

          service.setClientIdInRedux(service.configuration.ARO_CLIENT)
          return service.loadConfigurationFromServer()
        })
        .catch(err => console.error(err))
    }

    service.planEditorChanged = new Rx.BehaviorSubject(false)
    service.serviceLayers = []
    // ToDo: Do not select service layers by name
    // we need a change in service GET /v1/library-entry needs to send id, identifier is not the same thing
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
    // expert mode refactor
    service.executeManualPlanTargetsQuery = () => {
      var query = service.formatExpertModeQuery(service.expertMode[service.selectedExpertMode], service.expertModeScopeContext)
      // select id from aro.location_entity where data_source_id = 1 and id in
      // (239573,239586,239607,91293,91306,91328,237792,86289,86290,109232,239603,145556,145557,239604,239552)
      $http.post('/locations/getLocationIds', { query: query })
        .then((result) => {
          var plan = service.plan

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
              toast('Latest Updates and Platform Improvements', {
                position: 'bottom-left',
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: true,
                onClick: () => service.showReleaseNotes(),
              })
          }
          localStorage.setItem(service.loggedInUser.id, JSON.stringify(service.listOfAppVersions))
        })
      service.showReleaseNotes = () => {
        service.setShowGlobalSettings()
        service.setCurrentViewToReleaseNotes('Release Notes')
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
        removePlanTargets: service.removePlanTargets,
        selectDataItems: service.selectDataItems,
        setNetworkAnalysisConstraints: service.setNetworkAnalysisConstraints,
        setNetworkAnalysisConnectivityDefinition: service.setNetworkAnalysisConnectivityDefinition,
        setPrimarySpatialEdge: service.setPrimarySpatialEdge,
        clearWormholeFuseDefinitions: service.clearWormholeFuseDefinitions,
        setWormholeFuseDefinition: service.setWormholeFuseDefinition
      }
    }

    // Define a tile box at zoom level 22 that covers the entire world
    const WORLD_ZOOM = 22
    const MAX_TILE_XY_AT_WORLD_ZOOM = Math.pow(2, WORLD_ZOOM) - 1
    const wholeWorldTileBox = { zoom: WORLD_ZOOM, x1: 0, y1: 0, x2: MAX_TILE_XY_AT_WORLD_ZOOM, y2: MAX_TILE_XY_AT_WORLD_ZOOM }

    const invalidateLayersInTileBox = (tileBox, layerNameRegexStrings) => {
      // First, mark the HTML cache so we know which tiles are invalidated
      tileDataService.displayInvalidatedTiles(layerNameRegexStrings, tileBox)

      // Then delete items from the tile data cache and the tile provider cache
      tileDataService.clearCacheInTileBox(layerNameRegexStrings, tileBox)
    }

    service.handlePlanModifiedEvent = msg => {

      // set plan state to `COMPLETED` when `COMMIT_TRANSACTION` is sent from socket
      service.plan.planState = PlanStates.COMPLETED
      service.setActivePlanState(PlanStates.COMPLETED)

      // If the tileBox is null, use a tile box that covers the entire world
      const content = JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(msg.content)))
      const tileBox = (content.vectorTileUpdate && content.vectorTileUpdate.tileBox) || wholeWorldTileBox
      const layerNameRegexStrings = MapLayerHelper.getRegexForAllDataIds(service.mapLayersRedux, service.plan.id)
      invalidateLayersInTileBox(tileBox, layerNameRegexStrings)

      // Load list of modified features, and then refresh map layers. Note that this will make a call to
      // load modified features EVERY TIME an invalidation message is received. As of now there is no other
      // way to keep the data in-sync. Maybe we can get a flag from service as this is required only after
      // we commit a transaction.
      service.loadModifiedFeatures(service.plan.id)
        .then(() => service.requestMapLayerRefresh.next(null))
        .then(() => service.loadNetworkAnalysisReport(service.plan.id))
        .catch(err => console.error(err))
    }

    service.handleLibraryModifiedEvent = msg => {
      // If the tileBox is null, use a tile box that covers the entire world
      const content = JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(msg.content)))
      const tileBox = content.tileBox || wholeWorldTileBox
      const layerNameRegexStrings = MapLayerHelper.getRegexForAllDataIds(service.mapLayersRedux, null, msg.properties.headers.libraryId)
      invalidateLayersInTileBox(tileBox, layerNameRegexStrings)
      service.requestMapLayerRefresh.next(null)
    }

    service.handlePlanRefreshRequest = msg => {
      service.loadPlanRedux(service.plan.id)
    }

    service.unsubscribePlanEvent = SocketManager.subscribe('COMMIT_TRANSACTION', service.handlePlanModifiedEvent.bind(service))
    service.unsubscribeLibraryEvent1 = SocketManager.subscribe('USER_TRANSACTION', service.handleLibraryModifiedEvent.bind(service))
    service.unsubscribeLibraryEvent1 = SocketManager.subscribe('ETL_ADD', service.handleLibraryModifiedEvent.bind(service))
    service.unsubscribePlanRefresh = SocketManager.subscribe('PLAN_REFRESH', service.handlePlanRefreshRequest.bind(service))

    // NOTE: this is willReceiveProps in Angular vernacular
    service.mergeToTarget = (nextReduxState, actions) => {
      const currentActivePlanId = service.plan && service.plan.id
      const newActivePlanId = nextReduxState.plan && nextReduxState.plan.id
      const oldDataItems = service.dataItems

      // merge state and actions onto controller
      Object.assign(service, nextReduxState)
      Object.assign(service, actions)

      if ((currentActivePlanId !== newActivePlanId) && (nextReduxState.plan)) {
        // The active plan has changed. Note that we are comparing ids because a change in plan state also causes the plan object to update.
        service.onActivePlanChanged()
      }

      // ToDo: replace all instances of service.selectedDisplayMode
      //  with reduxState.plan.selectedDisplayMode
      //  We are currently maintaining state in two places
      //  BUT as of now are only setting it in redux
      if (nextReduxState.rSelectedDisplayMode &&
          service.rSelectedDisplayMode !== service.selectedDisplayMode.getValue()) {
        // console.log(service.rSelectedDisplayMode)
        service.selectedDisplayMode.next(service.rSelectedDisplayMode)
      }
      // if (nextReduxState.rActiveViewModePanel && 
      //     service.rActiveViewModePanel !== service.activeViewModePanel) {
      //   service.activeViewModePanel = service.rActiveViewModePanel
      // }

      if (
        nextReduxState.boundaries
        && JSON.stringify(nextReduxState.boundaries) !== JSON.stringify(service.angBoundaries.getValue())
      ) {
        service.angBoundaries.next(nextReduxState.boundaries)
        let layerCategories = {}
        for (const bounds of nextReduxState.boundaries) {
          layerCategories = Object.assign({}, layerCategories, bounds.categories)
        }
        service.layerCategories.next(layerCategories)
        service.setLayerCategories(layerCategories)
        service.requestMapLayerRefresh.next(null)
      }
    }
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(service.mergeToTarget.bind(service))

    return service
  }

  mapStateToThis (reduxState) {
    return {
      plan: reduxState.plan.activePlan,
      mapLayersRedux: reduxState.mapLayers,
      locationLayers: getLocationLayersList(reduxState),
      networkEquipmentLayers: getNetworkEquipmentLayersList(reduxState),
      boundaries: getBoundaryLayersList(reduxState),
      mapRef: reduxState.map.googleMaps,
      reduxPlanTargets: reduxState.selection.planTargets,
      showSiteBoundary: reduxState.mapLayers.showSiteBoundary,
      boundaryTypes: getBoundaryTypesList(reduxState),
      selectedBoundaryType: reduxState.mapLayers.selectedBoundaryType,
      systemActors: reduxState.user.systemActors,
      networkAnalysisConnectivityDefinition: reduxState.optimization.networkAnalysis.connectivityDefinition,
      networkAnalysisConstraints: networkAnalysisConstraintsSelector(reduxState, 'spatialEdgeType', 'snappingDistance', 'maxConnectionDistance', 'maxWormholeDistance', 'ringComplexityCount', 'maxLocationEdgeDistance', 'locationBufferSize', 'conduitBufferSize', 'targetEdgeTypes'),
      primarySpatialEdge: reduxState.optimization.networkAnalysis.primarySpatialEdge,
      wormholeFuseDefinitions: reduxState.optimization.networkAnalysis.wormholeFuseDefinitions,
      activeSelectionModeId: reduxState.selection.activeSelectionMode.id,
      optimizationInputs: reduxState.optimization.networkOptimization.optimizationInputs,
      rSelectedDisplayMode: reduxState.toolbar.rSelectedDisplayMode,
      rActiveViewModePanel: reduxState.toolbar.rActiveViewModePanel
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      setNetworkEquipmentLayerVisiblity: (layerType, layer, newVisibility) => dispatch(MapLayerActions.setNetworkEquipmentLayerVisibility(layerType, layer, newVisibility)),
      setCableConduitVisibility: (cableKey, conduitKey, newVisibility) => dispatch(MapLayerActions.setCableConduitVisibility(cableKey, conduitKey, newVisibility)),
      loadConfigurationFromServer: () => dispatch(UiActions.loadConfigurationFromServer()),
      setPerspective: perspective => dispatch(UiActions.setPerspective(perspective)),
      getStyleValues: () => dispatch(UiActions.getStyleValues()),
      loadAuthPermissionsRedux: () => dispatch(UserActions.loadAuthPermissions()),
      loadAuthRolesRedux: () => dispatch(UserActions.loadAuthRoles()),
      setLoggedInUserRedux: loggedInUser => dispatch(UserActions.setLoggedInUser(loggedInUser)),
      setClientIdInRedux: clientId => dispatch(ConfigurationActions.setClientId(clientId)),
      loadSystemActorsRedux: () => dispatch(UserActions.loadSystemActors()),
      loadReportPagesForPlan: planId => dispatch(MapReportsActions.loadReportPagesForPlan(planId)),
      setMapReportMapObjectsVisibility: isVisible => dispatch(MapReportsActions.showMapObjects(isVisible)),
      setMapReportPageNumbersVisibility: isVisible => dispatch(MapReportsActions.showPageNumbers(isVisible)),
      setPlanRedux: plan => dispatch(PlanActions.setActivePlan(plan)),
      setSelectionTypeById: selectionTypeId => dispatch(SelectionActions.setActiveSelectionMode(selectionTypeId)),
      addPlanTargets: (planId, planTargets) => dispatch(SelectionActions.addPlanTargets(planId, planTargets)),
      removePlanTargets: (planId, planTargets) => dispatch(SelectionActions.removePlanTargets(planId, planTargets)),
      setSelectedLocations: locationIds => dispatch(SelectionActions.setLocations(locationIds)),
      setMapFeatures: mapFeatures => dispatch(SelectionActions.setMapFeatures(mapFeatures)),
      setSelectedDisplayMode: displayMode => dispatch(ToolBarActions.selectedDisplayMode(displayMode)),
      setActivePlanState: planState => dispatch(PlanActions.setActivePlanState(planState)),
      selectDataItems: (dataItemKey, selectedLibraryItems) => dispatch(PlanActions.selectDataItems(dataItemKey, selectedLibraryItems)),
      loadPlanRedux: planId => dispatch(PlanActions.loadPlan(planId)),
      setGoogleMapsReference: mapRef => dispatch(MapActions.setGoogleMapsReference(mapRef)),
      setNetworkEquipmentLayers: networkEquipmentLayers => dispatch(MapLayerActions.setNetworkEquipmentLayers(networkEquipmentLayers)),
      setCopperLayers: copperLayers => dispatch(MapLayerActions.setCopperLayers(copperLayers)),
      updateShowSiteBoundary: isVisible => dispatch(MapLayerActions.setShowSiteBoundary(isVisible)),
      setLocationFilters: locationFilters => dispatch(MapLayerActions.setLocationFilters(locationFilters)),
      setLocationFilterChecked: locationFilters => dispatch(MapLayerActions.setLocationFilterChecked(filterType, ruleKey, isChecked)),
      onFeatureSelectedRedux: features => dispatch(RingEditActions.onFeatureSelected(features)),
      loadNetworkAnalysisReport: planId => dispatch(NetworkAnalysisActions.loadReport(planId)),
      setNetworkAnalysisConstraints: aroNetworkConstraints => dispatch(NetworkAnalysisActions.setNetworkAnalysisConstraints(aroNetworkConstraints)),
      setNetworkAnalysisConnectivityDefinition: (spatialEdgeType, networkConnectivityType) => dispatch(NetworkAnalysisActions.setNetworkAnalysisConnectivityDefinition(spatialEdgeType, networkConnectivityType)),
      setOptimizationInputs: inputs => dispatch(NetworkOptimizationActions.setOptimizationInputs(inputs)),
      setPrimarySpatialEdge: primarySpatialEdge => dispatch(NetworkAnalysisActions.setPrimarySpatialEdge(primarySpatialEdge)),
      clearWormholeFuseDefinitions: () => dispatch(NetworkAnalysisActions.clearWormholeFuseDefinitions()),
      setWormholeFuseDefinition: (spatialEdgeType, wormholeFusionTypeId) => dispatch(NetworkAnalysisActions.setWormholeFuseDefinition(spatialEdgeType, wormholeFusionTypeId)),
      setShowLocationLabels: showLocationLabels => dispatch(ViewSettingsActions.setShowLocationLabels(showLocationLabels)),
      setShowEquipmentLabelsChanged: showEquipmentLabels => dispatch(ToolBarActions.setShowEquipmentLabelsChanged(showEquipmentLabels)),
      setAppConfiguration: appConfiguration => dispatch(ToolBarActions.setAppConfiguration(appConfiguration)),
      updateDefaultPlanCoordinates: coordinates => dispatch(PlanActions.updateDefaultPlanCoordinates(coordinates)),
      setSelectedHeatMapOption: selectedHeatMapOption => dispatch(ToolBarActions.setSelectedHeatMapOption(selectedHeatMapOption)),
      setEnumStrings: enumStrings => dispatch(RoicReportsActions.setEnumStrings(enumStrings)),
      setTypeVisibility: (typeVisibility) => dispatch(MapLayerActions.setTypeVisibility(typeVisibility)),
      setLayerCategories: (layerCategories) => dispatch(StateViewModeActions.setLayerCategories(layerCategories)),
      rClearViewMode: (value) => dispatch(StateViewModeActions.clearViewMode(value)),
      loadEdgeConstructionTypeIds: () => dispatch(MapLayerActions.loadEdgeConstructionTypeIds()),
      setIsReportMode: reportMode => dispatch(MapReportsActions.setIsReportMode(reportMode)),
      setShowGlobalSettings: () => dispatch(GlobalSettingsActions.setShowGlobalSettings(true)),
      setCurrentViewToReleaseNotes: (viewString) => dispatch(GlobalSettingsActions.setCurrentViewToReleaseNotes(viewString)),
    }
  }
}

State.$inject = ['$rootScope', '$http', '$document', '$timeout', '$sce', '$ngRedux', '$filter', 'tileDataService', 'Utils', 'tracker', 'rxState']

export default State
