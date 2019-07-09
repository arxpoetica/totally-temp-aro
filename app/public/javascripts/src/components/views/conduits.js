/* globals angular */
import { createSelector } from 'reselect'
import MapLayerActions from '../../react/components/map-layers/map-layer-actions'

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllNetworkEquipmentLayers = reduxState => reduxState.mapLayers.networkEquipment
const getNetworkEquipmentLayersList = createSelector([getAllNetworkEquipmentLayers], networkEquipmentLayers => networkEquipmentLayers)
const getConduitsArray = createSelector([getAllNetworkEquipmentLayers], networkEquipmentLayers => {
  var conduitsArray = []
  if (networkEquipmentLayers.conduits) {
    Object.keys(networkEquipmentLayers.conduits).forEach(key => conduitsArray.push(networkEquipmentLayers.conduits[key]))
  }
  return conduitsArray
})

class ConduitsController {
  constructor ($rootScope, $ngRedux, map_tools, state) {
    this.map_tools = map_tools
    this.state = state
    this.currentUser = state.loggedInUser

    // When the map zoom changes, map layers can change
    $rootScope.$on('map_zoom_changed', () => this.updateMapLayers())

    state.mapReadyPromise.then(() => {
      this.updateMapLayers()
    })

    // Update map layers when the dataItems property of state changes
    state.dataItemsChanged
      .skip(1)
      .subscribe((newValue) => this.updateMapLayers())

    // Update map layers when the dataItems property of state changes
    state.viewSettingsChanged
      .skip(1)
      .subscribe((newValue) => this.updateMapLayers())

    this.createdMapLayerKeys = new Set()

    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this.mergeToTarget.bind(this))
  }

  // Get the line transformation mode with the current zoom level
  getLineTransformForLayer (zoomThreshold) {
    var mapZoom = this.mapRef.getZoom()
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoom > zoomThreshold) ? 'select' : 'smooth_absolute'
  }

  // Replaces any occurrences of searchText by replaceText in the keys of an object
  objectKeyReplace (obj, searchText, replaceText) {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(searchText, replaceText)
        obj[key] = obj[key].replace(searchText, replaceText) // TODO: Parag - Do replaceAll correctly
      }
    })
  }

  // Creates a single map layer by substituting tileDefinition parameters
  createSingleMapLayer (conduitKey, categoryType, networkEquipment, libraryId) {
    var existingOrPlannedzIndex = this.state.configuration.networkEquipment.tileDefinitions[categoryType].zIndex
    delete this.state.configuration.networkEquipment.tileDefinitions[categoryType].zIndex
    var tileDefinition = angular.copy(this.state.configuration.networkEquipment.tileDefinitions[categoryType])
    this.objectKeyReplace(tileDefinition, '{spatialEdgeType}', conduitKey)
    this.objectKeyReplace(tileDefinition, '{libraryId}', libraryId)
    var lineTransform = this.getLineTransformForLayer(+networkEquipment.aggregateZoomThreshold)
    this.objectKeyReplace(tileDefinition, '{lineTransform}', lineTransform)

    // For equipments, we are going to filter out features that are planned and deleted
    var drawingOptions = angular.copy(networkEquipment.drawingOptions)
    drawingOptions.lineWidth = feature => networkEquipment.drawingOptions.lineWidths[feature.size_category]
    return {
      tileDefinitions: [tileDefinition],
      iconUrl: networkEquipment.iconUrl,
      greyOutIconUrl: networkEquipment.greyOutIconUrl,
      renderMode: 'PRIMITIVE_FEATURES', // Always render equipment nodes as primitives
      featureFilter: null,
      strokeStyle: networkEquipment.drawingOptions.strokeStyle,
      lineWidth: networkEquipment.drawingOptions.lineWidth || 2,
      fillStyle: networkEquipment.drawingOptions.fillStyle,
      opacity: networkEquipment.drawingOptions.opacity || 0.5,
      drawingOptions: drawingOptions,
      selectable: true,
      zIndex: networkEquipment.zIndex + (existingOrPlannedzIndex || 0),
      showPolylineDirection: networkEquipment.drawingOptions.showPolylineDirection && this.state.showDirectedCable, // Showing Direction
      highlightStyle: networkEquipment.highlightStyle
    }
  }

  // Creates map layers for a specified category (e.g. "equipment")
  createMapLayersForCategory (categoryItems, categoryType, mapLayers, createdMapLayerKeys) {
    // First loop through all the equipment types (e.g. central_office)
    categoryItems && Object.keys(categoryItems).forEach((categoryItemKey) => {
      var networkEquipment = categoryItems[categoryItemKey]

      if (networkEquipment.equipmentType !== 'point' ||
        this.usePointAggregate ||
        this.mapRef.getZoom() > networkEquipment.aggregateZoomThreshold) {
        if (networkEquipment.checked) {
          // We need to show the existing network equipment. Loop through all the selected library ids.
          this.state.dataItems && this.state.dataItems[networkEquipment.dataItemKey] &&
            this.state.dataItems[networkEquipment.dataItemKey].selectedLibraryItems.forEach((selectedLibraryItem) => {
              var mapLayerKey = `${categoryItemKey}_existing_${selectedLibraryItem.identifier}`
              mapLayers[mapLayerKey] = this.createSingleMapLayer(categoryItemKey, categoryType, networkEquipment, selectedLibraryItem.identifier, null)
              createdMapLayerKeys.add(mapLayerKey)
            })
        }
      }
    })
  }

  updateMapLayers () {
    if (!this.networkEquipmentLayers) return
    // Make a copy of the state mapLayers. We will update this
    var oldMapLayers = angular.copy(this.state.mapLayers.getValue())

    // Remove all the map layers previously created by this controller
    this.createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })

    // Create layers for network equipment nodes and cables
    this.createdMapLayerKeys.clear()
    this.createMapLayersForCategory(this.networkEquipmentLayers.conduits, 'conduit', oldMapLayers, this.createdMapLayerKeys)

    // "oldMapLayers" now contains the new layers. Set it in the state
    this.state.mapLayers.next(oldMapLayers)
  }

  // Change the visibility of a network equipment layer. layerObj should refer to an object
  // in state.js --> networkEquipments[x].layers
  changeLayerVisibility (layerObj, isVisible) {
    // "visibilityType" allows us to distinguish between planned and existing layers
    layerObj.checked = isVisible
    this.updateMapLayers()
  }

  getBackgroundColor (layer) {
    return layer.drawingOptions.strokeStyle
  }

  mapStateToThis (reduxState) {
    return {
      networkEquipmentLayers: getNetworkEquipmentLayersList(reduxState),
      conduitsArray: getConduitsArray(reduxState),
      mapRef: reduxState.map.googleMaps
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      setNetworkEquipmentLayers: (networkEquipmentLayers) => dispatch(MapLayerActions.setNetworkEquipmentLayers(networkEquipmentLayers)),
      updateLayerVisibility: (layerType, layer, isVisible) => {
        // First set the visibility of the current layer
        dispatch(MapLayerActions.setNetworkEquipmentLayerVisibility(layerType, layer, isVisible))
      },
      updateType: (visibilityType, isVisible) => {
        dispatch(MapLayerActions.setNetworkEquipmentLayerVisibilityType(visibilityType, isVisible))
      }
    }
  }

  mergeToTarget (nextState, actions) {
    const currentNetworkEquipmentLayers = this.networkEquipmentLayers

    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)

    if (currentNetworkEquipmentLayers !== nextState.networkEquipmentLayers) {
      this.updateMapLayers()
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }
}

ConduitsController.$inject = ['$rootScope', '$ngRedux', 'map_tools', 'state']

let conduits = {
  templateUrl: '/components/views/conduits.html',
  bindings: {},
  controller: ConduitsController
}

export default conduits
