/* globals angular */
import { createSelector } from 'reselect'
import MapLayerActions from '../../react/components/map-layers/map-layer-actions'

// We need a selector, else the .toJS() call will create an infinite digest loop
// https://www.npmjs.com/package/reselect
const getAllCopperLayers = reduxState => reduxState.mapLayers.copper
const getCopperLayersList = createSelector([getAllCopperLayers], copperLayers => copperLayers)
const getCopperArray = createSelector([getAllCopperLayers], copperLayers => {
  var copperArray = []
  if (copperLayers.categories) {
    Object.keys(copperLayers.categories).forEach(key => copperArray.push(copperLayers.categories[key]))
  }
  return copperArray
})

class CopperController {
  constructor ($rootScope, $ngRedux, map_tools, state) {
    this.map_tools = map_tools
    this.state = state
    this.currentUser = state.loggedInUser
    this.openRow = null

    // When the map zoom changes, map layers can change
    $rootScope.$on('map_zoom_changed', () => this.updateMapLayers())

    state.mapReadyPromise.then(() => {
      this.updateMapLayers()
    })

    // Update map layers when the view settings change
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
  createSingleMapLayer (copper, libraryId) {
    var tileDefinition = angular.copy(this.state.configuration.copperCategories.categories.UNKNOWN.tileDefinitions[0])
    this.objectKeyReplace(tileDefinition, '{libraryId}', libraryId)

    if (copper.equipmentType === 'line') {
      var lineTransform = this.getLineTransformForLayer(+copper.aggregateZoomThreshold)
      this.objectKeyReplace(tileDefinition, '{lineTransform}', lineTransform)
    }

    // For equipments, we are going to filter out features that are planned and deleted
    var drawingOptions = angular.copy(copper.drawingOptions)
    return {
      tileDefinitions: [tileDefinition],
      iconUrl: copper.iconUrl,
      greyOutIconUrl: copper.greyOutIconUrl,
      renderMode: 'PRIMITIVE_FEATURES', // Always render equipment nodes as primitives
      featureFilter: null,
      strokeStyle: copper.drawingOptions.strokeStyle,
      lineWidth: copper.drawingOptions.lineWidth || 2,
      fillStyle: copper.drawingOptions.fillStyle,
      opacity: copper.drawingOptions.opacity || 0.5,
      drawingOptions: drawingOptions,
      selectable: true,
      zIndex: copper.zIndex,
      showPolylineDirection: copper.drawingOptions.showPolylineDirection && this.state.showDirectedCable, // Showing Direction
      highlightStyle: copper.highlightStyle
    }
  }

  // Creates map layers for a specified category (e.g. "equipment")
  createMapLayersForCategory (categoryItems, categoryType, mapLayers, createdMapLayerKeys) {
    // First loop through all the equipment types (e.g. central_office)
    categoryItems && Object.keys(categoryItems).forEach((categoryItemKey) => {
      var copper = categoryItems[categoryItemKey]

      if (copper.equipmentType !== 'point' ||
        this.usePointAggregate ||
        this.mapRef.getZoom() > copper.aggregateZoomThreshold) {
        if (copper.checked) {
          // We need to show the existing copper. Loop through all the selected library ids.
          this.dataItems && this.dataItems[copper.dataItemKey] &&
            this.dataItems[copper.dataItemKey].selectedLibraryItems.forEach((selectedLibraryItem) => {
              var mapLayerKey = `${categoryItemKey}_existing_${selectedLibraryItem.identifier}`
              mapLayers[mapLayerKey] = this.createSingleMapLayer(copper, selectedLibraryItem.identifier)
              createdMapLayerKeys.add(mapLayerKey)
            })
        }
      }

      // Sync ruler option
      copper.key === 'UNKNOWN' && this.syncRulerOptions(copper.key, copper.checked)
    })
  }

  updateMapLayers () {
    if (!this.copperLayers) return
    // Make a copy of the state mapLayers. We will update this
    var oldMapLayers = angular.copy(this.state.mapLayers.getValue())

    // Remove all the map layers previously created by this controller
    this.createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })

    // Create layers for copper
    this.createdMapLayerKeys.clear()
    this.createMapLayersForCategory(this.copperLayers.categories, 'UNKNOWN', oldMapLayers, this.createdMapLayerKeys)

    // "oldMapLayers" now contains the new layers. Set it in the state
    this.state.mapLayers.next(oldMapLayers)
  }

  syncRulerOptions (layerKey, isLayerEnabled) {
    if (isLayerEnabled) {
      !this.state.rulerActions.includes(this.state.allRulerActions.COPPER) &&
        this.state.rulerActions.push(this.state.allRulerActions.COPPER)
    } else {
      for (var i in this.state.rulerActions) {
        if (this.state.rulerActions[i].id == layerKey) {
          this.state.rulerActions.splice(i, 1);
        }
      }
    }
  }

  getBackgroundColor (layer) {
    return layer.drawingOptions.strokeStyle
  }

  mapStateToThis (reduxState) {
    return {
      planId: reduxState.plan.activePlan && reduxState.plan.activePlan.id,
      copperLayers: getCopperLayersList(reduxState),
      copperArray: getCopperArray(reduxState),
      dataItems: reduxState.plan.dataItems,
      mapRef: reduxState.map.googleMaps
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      setcopperLayers: (copperLayers) => dispatch(MapLayerActions.setCopperLayers(copperLayers)),
      updateLayerVisibility: (layerType, layer, isVisible) => {
        // First set the visibility of the current layer
        dispatch(MapLayerActions.setCopperLayerVisibility(layerType, layer, isVisible))
      }
    }
  }

  mergeToTarget (nextState, actions) {
    const currentcopperLayers = this.copperLayers
    const currentSelectedLibrary = this.dataItems && this.dataItems.fiber && this.dataItems.fiber.selectedLibraryItems

    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)

    const newSelectedLibrary = this.dataItems && this.dataItems.fiber && this.dataItems.fiber.selectedLibraryItems
    if ((currentcopperLayers !== nextState.copperLayers) ||
      (currentSelectedLibrary !== newSelectedLibrary)) {
      this.updateMapLayers()
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }
}

CopperController.$inject = ['$rootScope', '$ngRedux', 'map_tools', 'state']

let copper = {
  templateUrl: '/components/views/copper.html',
  bindings: {},
  controller: CopperController
}

export default copper
