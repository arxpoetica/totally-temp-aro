/* globals angular */
import { createSelector } from 'reselect'
import MapLayerActions from '../../react/components/map-layers/map-layer-actions'

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllNetworkEquipmentLayers = reduxState => reduxState.mapLayers.networkEquipment
const getNetworkEquipmentLayersList = createSelector([getAllNetworkEquipmentLayers], networkEquipmentLayers => networkEquipmentLayers)
const getCablesArray = createSelector([getAllNetworkEquipmentLayers], networkEquipmentLayers => {
  var cablesArray = []
  if (networkEquipmentLayers.cables) {
    Object.keys(networkEquipmentLayers.cables).forEach(key => cablesArray.push(networkEquipmentLayers.cables[key]))
  }
  return cablesArray
})
const getConduitsArray = createSelector([getAllNetworkEquipmentLayers], networkEquipmentLayers => {
  var conduitsArray = []
  if (networkEquipmentLayers.roads) {
    Object.keys(networkEquipmentLayers.roads).forEach(key => conduitsArray.push(networkEquipmentLayers.roads[key]))
  }
  if (networkEquipmentLayers.conduits) {
    Object.keys(networkEquipmentLayers.conduits).forEach(key => conduitsArray.push(networkEquipmentLayers.conduits[key]))
  }
  return conduitsArray
})

class CablesController {
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

    window.addEventListener('viewSettingsChanged', (newValue) => {
      this.updateMapLayers()
    });      

    this.createdMapLayerKeys = new Set()

    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this.mergeToTarget.bind(this))
  }

  toggleOpenRow (rowId) {
    if (this.openRow === rowId) {
      this.openRow = null
    } else {
      this.openRow = rowId
    }
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
  createSingleMapLayer (equipmentOrFiberKey, categoryType, networkEquipment, existingOrPlanned, libraryId, rootPlanId) {
    var existingOrPlannedzIndex = this.state.configuration.networkEquipment.tileDefinitions[categoryType][existingOrPlanned].zIndex
    var tileDefinition = angular.copy(this.state.configuration.networkEquipment.tileDefinitions[categoryType][existingOrPlanned])
    delete tileDefinition.zIndex
    this.objectKeyReplace(tileDefinition, '{networkNodeType}', equipmentOrFiberKey)
    this.objectKeyReplace(tileDefinition, '{fiberType}', equipmentOrFiberKey)
    this.objectKeyReplace(tileDefinition, '{libraryId}', libraryId)
    this.objectKeyReplace(tileDefinition, '{rootPlanId}', rootPlanId)

    if (networkEquipment.equipmentType === 'line') {
      var lineTransform = this.getLineTransformForLayer(+networkEquipment.aggregateZoomThreshold)
      this.objectKeyReplace(tileDefinition, '{lineTransform}', lineTransform)
    }

    // For equipments, we are going to filter out features that are planned and deleted
    var drawingOptions = angular.copy(networkEquipment.drawingOptions)
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
      showPolylineDirection: networkEquipment.drawingOptions.showPolylineDirection && (this.state.showDirectedCable || this.rShowDirectedCable), // Showing Direction
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
        if (this.state.cableLayerTypeVisibility.existing && networkEquipment.checked) {
          // We need to show the existing network equipment. Loop through all the selected library ids.
          this.dataItems && this.dataItems[networkEquipment.dataItemKey] &&
            this.dataItems[networkEquipment.dataItemKey].selectedLibraryItems.forEach((selectedLibraryItem) => {
              var mapLayerKey = `${categoryItemKey}_existing_${selectedLibraryItem.identifier}`
              mapLayers[mapLayerKey] = this.createSingleMapLayer(categoryItemKey, categoryType, networkEquipment, 'existing', selectedLibraryItem.identifier, null)
              createdMapLayerKeys.add(mapLayerKey)
            })
        }

        if (this.state.cableLayerTypeVisibility.planned && networkEquipment.checked && this.planId) {
          // We need to show the planned network equipment for this plan.
          var mapLayerKey = `${categoryItemKey}_planned`
          mapLayers[mapLayerKey] = this.createSingleMapLayer(categoryItemKey, categoryType, networkEquipment, 'planned', null, this.planId)
          createdMapLayerKeys.add(mapLayerKey)
        }
      }

      // Sync ruler option
      networkEquipment.key === 'COPPER' && this.syncRulerOptions(networkEquipment.key, networkEquipment.checked)
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
    this.createMapLayersForCategory(this.networkEquipmentLayers.cables, 'cable', oldMapLayers, this.createdMapLayerKeys)

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
      networkEquipmentLayers: getNetworkEquipmentLayersList(reduxState),
      cablesArray: getCablesArray(reduxState),
      conduitsArray: getConduitsArray(reduxState),
      dataItems: reduxState.plan.dataItems,
      mapRef: reduxState.map.googleMaps,
      rShowDirectedCable: reduxState.toolbar.showDirectedCable
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      setNetworkEquipmentLayers: (networkEquipmentLayers) => dispatch(MapLayerActions.setNetworkEquipmentLayers(networkEquipmentLayers)),
      updateLayerVisibility: (layerType, layer, isVisible) => {
        // First set the visibility of the current layer
        dispatch(MapLayerActions.setNetworkEquipmentLayerVisibility(layerType, layer, isVisible))
      },
      setCableConduitVisibility: (cableKey, conduitKey, isVisible) => dispatch(MapLayerActions.setCableConduitVisibility(cableKey, conduitKey, isVisible)),
      updateType: (visibilityType, isVisible) => {
        dispatch(MapLayerActions.setNetworkEquipmentLayerVisibilityType(visibilityType, isVisible))
      }
    }
  }

  mergeToTarget (nextState, actions) {
    const currentNetworkEquipmentLayers = this.networkEquipmentLayers
    const currentSelectedLibrary = this.dataItems && this.dataItems.fiber && this.dataItems.fiber.selectedLibraryItems

    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)

    const newSelectedLibrary = this.dataItems && this.dataItems.fiber && this.dataItems.fiber.selectedLibraryItems
    if ((currentNetworkEquipmentLayers !== nextState.networkEquipmentLayers) ||
      (currentSelectedLibrary !== newSelectedLibrary)) {
      this.updateMapLayers()
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }
}

CablesController.$inject = ['$rootScope', '$ngRedux', 'map_tools', 'state']

let cables = {
  templateUrl: '/components/views/cables.html',
  bindings: {},
  controller: CablesController
}

export default cables
