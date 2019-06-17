/* global angular globalServiceLayers */
import { createSelector } from 'reselect'
import { List } from 'immutable'
import MapLayerActions from '../../react/components/map-layers/map-layer-actions'

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllBoundaryLayers = state => state.mapLayers.boundary
const getBoundaryLayersList = createSelector([getAllBoundaryLayers], (boundaryLayer) => boundaryLayer.toJS())

class BoundariesController {
  constructor ($rootScope, $http, $ngRedux, state, map_tools) {
    this.$http = $http
    this.state = state
    this.map_tools = map_tools

    // Creates map layers based on selection in the UI
    this.createdMapLayerKeys = new Set()

    this.selectedCensusCat = null

    // When the map zoom changes, map layers can change
    $rootScope.$on('map_zoom_changed', this.updateMapLayers.bind(this))

    // Update map layers when the dataItems property of state changes
    this.state.dataItemsChanged.skip(1).subscribe((newValue) => this.updateMapLayers())

    // Update map layers when the display mode button changes
    this.state.selectedDisplayMode.subscribe((newValue) => this.updateMapLayers())

    this.censusCategories = this.state.censusCategories.getValue()
    this.state.censusCategories.subscribe((newValue) => {
      this.censusCategories = newValue
    })

    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this.mergeToTarget.bind(this))
  }

  reloadVisibleLayers () {
    return this.state.StateViewMode.loadEntityList(this.$http, this.state, 'AnalysisLayer', null, 'id,name,description', null)
      .then(() => {
        var newTileLayers = []
        var filteredGlobalServiceLayers = globalServiceLayers
        if (this.state.configuration.perspective && this.state.configuration.perspective.limitBoundaries.enabled) {
          const namesToInclude = this.state.configuration.perspective.limitBoundaries.showOnlyNames
          filteredGlobalServiceLayers = globalServiceLayers.filter((item) => namesToInclude.indexOf(item.name) >= 0)
        }
        var uiLayerId = 0
        filteredGlobalServiceLayers.forEach((serviceLayer) => {
          if (!serviceLayer.show_in_boundaries) return
          var wirecenterLayer = {
            uiLayerId: uiLayerId++,
            description: serviceLayer.description, // Service Areas
            type: 'wirecenter',
            key: 'wirecenter',
            layerId: serviceLayer.id
          }
          newTileLayers.push(wirecenterLayer)
        })

        var includeCensusBlocks = true
        if (this.state.configuration.perspective && this.state.configuration.perspective.limitBoundaries.enabled) {
          const namesToInclude = this.state.configuration.perspective.limitBoundaries.showOnlyNames
          includeCensusBlocks = namesToInclude.indexOf('census_blocks') >= 0
        }
        if (includeCensusBlocks) {
          newTileLayers.push({
            uiLayerId: uiLayerId++,
            description: 'Census Blocks',
            type: 'census_blocks',
            key: 'census_blocks'
          })
        }

        var analysisLayers = this.state.entityTypeList.AnalysisLayer
        if (this.state.configuration.perspective && this.state.configuration.perspective.limitBoundaries.enabled) {
          const namesToInclude = this.state.configuration.perspective.limitBoundaries.showOnlyNames
          analysisLayers = analysisLayers.filter((item) => namesToInclude.indexOf(item.name) >= 0)
        }
        analysisLayers.forEach((analysisLayer) => {
          newTileLayers.push({
            uiLayerId: uiLayerId++,
            description: analysisLayer.description,
            type: 'analysis_layer',
            key: 'analysis_layer',
            analysisLayerId: analysisLayer.id
          })
        })

        // enable visible boundaries by default
        newTileLayers.forEach((tileLayers) => {
          var isLayerVisible = this.state.configuration && this.state.configuration.boundaryCategories && this.state.configuration.boundaryCategories.categories[tileLayers.type].visible
          tileLayers.checked = isLayerVisible
        })
        this.setBoundaryLayers(new List(newTileLayers))
        return Promise.resolve()
      })
      .catch((err) => console.error(err))
  }

  onSelectCensusCat () {
    const id = this.selectedCensusCat && this.selectedCensusCat.id
    var newSelection = this.state.cloneSelection()
    newSelection.details.censusCategoryId = id
    this.state.selection = newSelection
  }

  // Replaces any occurrences of searchText by replaceText in the keys of an object
  objectKeyReplace (obj, searchText, replaceText) {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(searchText, replaceText)
      }
    })
  }

  updateMapLayers () {
    // ToDo: this function could stand to be cleaned up

    // ToDo: layerSettings will come from settings, possibly by way of one of the other arrays
    var layerSettings = this.state.configuration.boundaryCategories && this.state.configuration.boundaryCategories.categories

    if (layerSettings && layerSettings['wirecenter']) {
      layerSettings['default'] = layerSettings['wirecenter']
    }

    // Make a copy of the state mapLayers. We will update this
    var oldMapLayers = angular.copy(this.state.mapLayers.getValue())

    // Remove all the map layers previously created by this controller
    this.createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })

    this.createdMapLayerKeys.clear()

    // Add map layers based on the selection
    var selectedServiceAreaLibraries = this.state.dataItems && this.state.dataItems.service_layer && this.state.dataItems.service_layer.selectedLibraryItems
    if (selectedServiceAreaLibraries) {
      selectedServiceAreaLibraries.forEach((selectedServiceAreaLibrary) => {
        this.boundaryLayers.forEach((layer) => {
          if (layer.checked) {
            var layerOptions = layerSettings[layer.type]
            var pointTransform = this.getPointTransformForLayer(+layerOptions.aggregateZoomThreshold)
            var mapLayerKey = `${pointTransform}_${layer.uiLayerId}_${selectedServiceAreaLibrary.identifier}`
            var settingsKey = (pointTransform === 'smooth') ? 'aggregated_' + layer.type : layer.type

            if (!layerSettings.hasOwnProperty(settingsKey)) { settingsKey = 'default' }
            oldMapLayers[mapLayerKey] = angular.copy(layerSettings[settingsKey])
            var tileDefinition = angular.copy(layerOptions.tileDefinition)
            this.objectKeyReplace(tileDefinition, '{transform}', pointTransform)
            this.objectKeyReplace(tileDefinition, '{libraryId}', selectedServiceAreaLibrary.identifier)
            this.objectKeyReplace(tileDefinition, '{analysisLayerId}', layer.analysisLayerId)
            oldMapLayers[mapLayerKey].tileDefinitions = [tileDefinition]
            this.createdMapLayerKeys.add(mapLayerKey)
          }
        })
      })
    }

    // "oldMapLayers" now contains the new layers. Set it in the state
    this.state.mapLayers.next(oldMapLayers)
  }

  $doCheck () {
    // When the perspective changes, some map layers may be hidden/shown.
    if (this.oldPerspective !== this.state.configuration.perspective) {
      this.oldPerspective = this.state.configuration.perspective
      this.reloadVisibleLayers()
    }
  }

  // Get the point transformation mode with the current zoom level
  getPointTransformForLayer (zoomThreshold) {
    var mapZoom = map.getZoom()
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoom > zoomThreshold) ? 'select' : 'smooth'
  }

  $onInit () {
    this.reloadVisibleLayers()
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  mapStateToThis (state) {
    return {
      boundaryLayers: getBoundaryLayersList(state)
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      setBoundaryLayers: (boundaryLayers) => dispatch(MapLayerActions.setBoundaryLayers(boundaryLayers)),
      updateLayerVisibility: (layer, isVisible) => {
        // First set the visibility of the current layer
        dispatch(MapLayerActions.setLayerVisibility(layer, isVisible))
      }
    }
  }

  mergeToTarget (nextState, actions) {
    const currentBoundaryLayers = this.boundaryLayers

    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)

    if (currentBoundaryLayers !== nextState.boundaryLayers) {
      this.updateMapLayers()
    }
  }
}

BoundariesController.$inject = ['$rootScope', '$http', '$ngRedux', 'state', 'map_tools']

let boundaries = {
  templateUrl: '/components/views/boundaries.html',
  bindings: {},
  controller: BoundariesController
}

export default boundaries
