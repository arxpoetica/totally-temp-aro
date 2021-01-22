import { createSelector } from 'reselect'
import { List } from 'immutable'
import MapLayerActions from '../../react/components/map-layers/map-layer-actions'

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllNetworkEquipmentLayers = reduxState => reduxState.mapLayers.networkEquipment
const getNetworkEquipmentLayersList = createSelector([getAllNetworkEquipmentLayers], networkEquipmentLayers => networkEquipmentLayers)
const getEquipmentsArray = createSelector([getAllNetworkEquipmentLayers], networkEquipmentLayers => {
  var equipmentsArray = []
  if (networkEquipmentLayers.equipments) {
    Object.keys(networkEquipmentLayers.equipments).forEach(key => equipmentsArray.push(networkEquipmentLayers.equipments[key]))
  }
  return equipmentsArray
})

class NetworkEquipmentController {
  constructor($rootScope, $http, $location, $ngRedux, map_tools, state,rxState) {
    this.map_tools = map_tools
    this.state = state
    this.currentUser = state.loggedInUser
    this.mapZoom = 0// map.getZoom()
    this.equ_tdc_order = ['central_office', 'olt', 'splice_point', 'fiber_distribution_hub', 'fiber_distribution_terminal', 'multiple_dwelling_unit', 'bulk_distribution_terminal', 'dslam', 'cell_5g', 'loop_extender', 'network_anchor']
    this.usePointAggregate = false // aggregating multiple pieces of equipment under one marker causes problems with Equipment Selection

    // When the map zoom changes, map layers can change
    $rootScope.$on('map_zoom_changed', () => this.updateMapLayers())

    state.mapReadyPromise.then(() => {
      this.updateMapLayers()
    })

    // Update map layers when the dataItems property of state changes
    state.viewSettingsChanged
      .skip(1)
      .subscribe((newValue) => this.updateMapLayers())

    // Update map layers when the dataItems property of state changes
    rxState.viewSettingsChanged.getMessage().skip(1).subscribe((data) => {
      this.updateMapLayers()
    }) 

    this.createdMapLayerKeys = new Set()

    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this.mergeToTarget.bind(this))
  }

  $doCheck() { // is this still needed?
    const networkEquipments = this.state.configuration.networkEquipment && this.state.configuration.networkEquipment.equipments
    if (networkEquipments && (this.cachedNetworkEquipments !== networkEquipments)) {
      if (this.state.configuration && (this.state.configuration.ARO_CLIENT === 'tdc')) {
        var equ = angular.copy(this.state.configuration.networkEquipment.equipments)
        this.state.configuration.networkEquipment.equipments = {}
        this.equ_tdc_order.forEach((key) => {
          this.state.configuration.networkEquipment.equipments[key] = equ[key]
        })
      }
      this.setNetworkEquipmentLayers(this.state.configuration.networkEquipment)
      this.cachedNetworkEquipments = networkEquipments
    }
  }

  // Get the point transformation mode with the current zoom level
  getPointTransformForLayer(zoomThreshold) {
    var mapZoom = map.getZoom()
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoom > zoomThreshold) ? 'select' : 'aggregate'
  }

  // Get the line transformation mode with the current zoom level
  getLineTransformForLayer(zoomThreshold) {
    var mapZoom = map.getZoom()
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoom > zoomThreshold) ? 'select' : 'smooth_absolute'
  }

  // Get the polygon transformation mode with the current zoom level
  getPolygonTransformForLayer(zoomThreshold) {
    var mapZoom = map.getZoom()
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoom > zoomThreshold) ? 'select' : 'smooth'
  }

  // Replaces any occurrences of searchText by replaceText in the keys of an object
  objectKeyReplace(obj, searchText, replaceText) {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(searchText, replaceText)
        obj[key] = obj[key].replace(searchText, replaceText) // TODO: Parag - Do replaceAll correctly
      }
    })
  }

  // Creates a single map layer by substituting tileDefinition parameters
  createSingleMapLayer(equipmentOrFiberKey, categoryType, networkEquipment, existingOrPlanned, libraryId, rootPlanId) {
    var existingOrPlannedzIndex = this.state.configuration.networkEquipment.tileDefinitions[categoryType][existingOrPlanned].zIndex
    var tileDefinition = angular.copy(this.state.configuration.networkEquipment.tileDefinitions[categoryType][existingOrPlanned])
    delete tileDefinition.zIndex
    this.objectKeyReplace(tileDefinition, '{networkNodeType}', equipmentOrFiberKey)
    this.objectKeyReplace(tileDefinition, '{fiberType}', equipmentOrFiberKey)
    this.objectKeyReplace(tileDefinition, '{libraryId}', libraryId)
    this.objectKeyReplace(tileDefinition, '{rootPlanId}', rootPlanId)

    if (networkEquipment.equipmentType === 'point') {
      var pointTransform = this.getPointTransformForLayer(+networkEquipment.aggregateZoomThreshold)
      this.objectKeyReplace(tileDefinition, '{pointTransform}', pointTransform)
    } else if (networkEquipment.equipmentType === 'line') {
      var lineTransform = this.getLineTransformForLayer(+networkEquipment.aggregateZoomThreshold)
      this.objectKeyReplace(tileDefinition, '{lineTransform}', lineTransform)
    } else if (networkEquipment.equipmentType === 'polygon') {
      var polygonTransform = this.getPolygonTransformForLayer(+networkEquipment.aggregateZoomThreshold)
      this.objectKeyReplace(tileDefinition, '{polygonTransform}', polygonTransform)
    }

    // For equipments, we are going to filter out features that are planned and deleted
    var featureFilter = null
    var drawingOptions = angular.copy(networkEquipment.drawingOptions)
    var subtypes = null
    if (categoryType === 'equipment') {
      featureFilter = (feature) => {
        // For now, just hide equipment features that are Planned and Deleted
        return (!feature.properties.deployment_type ||
          (feature.properties.deployment_type === 1) ||
          (feature.properties.is_deleted !== 'true'))
      }

      if ((this.state.showEquipmentLabels || this.rShowEquipmentLabels) && map.getZoom() > this.networkEquipmentLayers.labelDrawingOptions.visibilityZoomThreshold) {
        drawingOptions.labels = this.networkEquipmentLayers.labelDrawingOptions
      }
      subtypes = { ...networkEquipment.subtypes }
    } else if (categoryType === 'boundaries') {
      featureFilter = (feature) => {
        // Show boundaries with the currently selected boundary type AND that are not marked as deleted
        return (feature.properties.boundary_type === this.state.selectedBoundaryType.id) &&
          (feature.properties.is_deleted !== 'true')
      }
      // Why this hack for boundaries? Because boundary layers are not explicitly shown via a checkbox in the UI.
      // So we just turn on the "0" subtype for all boundary layers. The filter will take care of hiding based on boundary type.
      subtypes = { 0: true }
    }

    return { // ToDo: this needs to be a class and the same class as in the reducer
      tileDefinitions: [tileDefinition],
      iconUrl: networkEquipment.iconUrl,
      greyOutIconUrl: networkEquipment.greyOutIconUrl,
      renderMode: 'PRIMITIVE_FEATURES', // Always render equipment nodes as primitives
      featureFilter: featureFilter,
      strokeStyle: networkEquipment.drawingOptions.strokeStyle,
      lineWidth: networkEquipment.drawingOptions.lineWidth || 2,
      fillStyle: networkEquipment.drawingOptions.fillStyle,
      opacity: networkEquipment.drawingOptions.opacity || 0.5,
      drawingOptions: drawingOptions,
      selectable: true,
      zIndex: networkEquipment.zIndex + (existingOrPlannedzIndex || 0),
      highlightStyle: networkEquipment.highlightStyle,
      subtypes: subtypes
    }
  }

  // Creates map layers for a specified category (e.g. "equipment")
  createMapLayersForCategory (categoryItems, categoryType, mapLayers, createdMapLayerKeys) {
    // First loop through all the equipment types (e.g. central_office)
    this.mapZoom = map.getZoom()
    categoryItems && Object.keys(categoryItems).forEach((categoryItemKey) => {
      var networkEquipment = categoryItems[categoryItemKey]

      if (networkEquipment.equipmentType !== 'point' ||
        this.usePointAggregate ||
        this.mapZoom > networkEquipment.aggregateZoomThreshold) {
        if (this.state.equipmentLayerTypeVisibility.existing && networkEquipment.checked) {
          // We need to show the existing network equipment. Loop through all the selected library ids.
          this.dataItems && this.dataItems[networkEquipment.dataItemKey] &&
            this.dataItems[networkEquipment.dataItemKey].selectedLibraryItems.forEach((selectedLibraryItem) => {
              var mapLayerKey = `${categoryItemKey}_existing_${selectedLibraryItem.identifier}`
              mapLayers[mapLayerKey] = this.createSingleMapLayer(categoryItemKey, categoryType, networkEquipment, 'existing', selectedLibraryItem.identifier, null)
              createdMapLayerKeys.add(mapLayerKey)
            })
        }

        const planId = this.state.plan && this.state.plan && this.state.plan.id
        if (this.state.equipmentLayerTypeVisibility.planned && networkEquipment.checked && planId) {
          // We need to show the planned network equipment for this plan.
          var mapLayerKey = `${categoryItemKey}_planned`
          mapLayers[mapLayerKey] = this.createSingleMapLayer(categoryItemKey, categoryType, networkEquipment, 'planned', null, planId)
          createdMapLayerKeys.add(mapLayerKey)
        }
      }
    })
  }

  createMapLayersForBoundaryCategory(categoryItems, categoryType, mapLayers, createdMapLayerKeys) {
    // First loop through all the equipment types
    this.mapZoom = map.getZoom()
    // Boundary selection depends on showSiteBoundary checkbox and the selected boundary type in the dropdown
    categoryItems && Object.keys(categoryItems).forEach((categoryItemKey) => {
      var networkEquipment = categoryItems[categoryItemKey]

      var selectedBoundaryName
      this.state.selectedBoundaryType.name !== 'fiveg_coverage' ? selectedBoundaryName = 'siteBoundaries' : selectedBoundaryName = 'fiveg_coverage'

      // Type of Boundary to show
      if ((networkEquipment.equipmentType !== 'point' ||
        this.usePointAggregate ||
        this.mapZoom > networkEquipment.aggregateZoomThreshold) && selectedBoundaryName === categoryItemKey) {

        // Existing Boundaries
        if (this.state.equipmentLayerTypeVisibility.existing && this.state.showSiteBoundary) {
          // We need to show the existing network equipment. Loop through all the selected library ids.
          this.dataItems && this.dataItems[networkEquipment.dataItemKey] &&
            this.dataItems[networkEquipment.dataItemKey].selectedLibraryItems.forEach((selectedLibraryItem) => {
              var mapLayerKey = `${categoryItemKey}_existing_${selectedLibraryItem.identifier}`
              mapLayers[mapLayerKey] = this.createSingleMapLayer(categoryItemKey, categoryType, networkEquipment, 'existing', selectedLibraryItem.identifier, null)
              createdMapLayerKeys.add(mapLayerKey)
            })
        }

        // Planned Boundaries
        const planId = this.state.plan && this.state.plan && this.state.plan.id
        if (this.state.equipmentLayerTypeVisibility.planned && this.state.showSiteBoundary && planId) {
          // We need to show the planned network equipment for this plan.
          var mapLayerKey = `${categoryItemKey}_planned`
          mapLayers[mapLayerKey] = this.createSingleMapLayer(categoryItemKey, categoryType, networkEquipment, 'planned', null, planId)
          createdMapLayerKeys.add(mapLayerKey)
        }
      }

    })
  }

  // ---

  // We will change this later,
  //  currently we are just telling Redux that these values have changed
  //  next: change over all components that read the state.js version to using Redux

  onUpdateExistingEquipmentVisibility () {
    // these shouldn't be hardcoded but this will all be migrated shortly
    this.onUpdateTypeVisibility('equipment', 'existing', this.state.equipmentLayerTypeVisibility.existing)
  }
  onUpdatePlannedEquipmentVisibility () {
    this.onUpdateTypeVisibility('equipment', 'planned', this.state.equipmentLayerTypeVisibility.planned)
  }

  onUpdateTypeVisibility (typeA, typeB, isVisible) {
    // typeA: equipment / cable
    // typeB: existing / planned
    var typeVisibility = {}
    typeVisibility[typeA] = {}
    typeVisibility[typeA][typeB] = isVisible
    this.setTypeVisibility(typeVisibility)
    
    this.updateMapLayers()
  }

  // ---

  // ToDo: this does not belong here. Don't put the powerplant in the light switch.
  updateMapLayers() {
    if(!this.networkEquipmentLayers) return
    // Make a copy of the state mapLayers. We will update this
    var oldMapLayers = angular.copy(this.state.mapLayers.getValue())

    // Remove all the map layers previously created by this controller
    this.createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })

    // Create layers for network equipment nodes
    this.createdMapLayerKeys.clear()
    this.createMapLayersForCategory(this.networkEquipmentLayers.equipments, 'equipment', oldMapLayers, this.createdMapLayerKeys)
    this.createMapLayersForBoundaryCategory(this.networkEquipmentLayers.boundaries, 'boundaries', oldMapLayers, this.createdMapLayerKeys)

    // "oldMapLayers" now contains the new layers. Set it in the state
    this.state.mapLayers.next(oldMapLayers)
  }

  // Change the visibility of a network equipment layer. layerObj should refer to an object
  // in state.js --> networkEquipments[x].layers
  changeLayerVisibility(layerObj, isVisible) {
    // "visibilityType" allows us to distinguish between planned and existing layers
    layerObj.checked = isVisible
    this.updateMapLayers()
  }

  zoomTo(zoomLevel) {
    zoomLevel = Number(zoomLevel) + 1
    this.state.requestSetMapZoom.next(zoomLevel)
  }

  mapStateToThis (reduxState) {
    return {
      networkEquipmentLayers: getNetworkEquipmentLayersList(reduxState),
      equipmentsArray: getEquipmentsArray(reduxState),
      dataItems: reduxState.plan.dataItems,
      showSiteBoundary: reduxState.mapLayers.showSiteBoundary,
      selectedBoundaryType: reduxState.mapLayers.selectedBoundaryType,
      rShowEquipmentLabels: reduxState.toolbar.showEquipmentLabels,
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      setNetworkEquipmentLayers: (networkEquipmentLayers) => dispatch(MapLayerActions.setNetworkEquipmentLayers(networkEquipmentLayers)),
      updateLayerVisibility: (layerType, layer, isVisible) => {
        dispatch(MapLayerActions.setNetworkEquipmentLayerVisibility(layerType, layer, isVisible))
      },
      setNetworkEquipmentSubtypeVisibility: (layerType, layer, subtypeId, isVisible) => {
        dispatch(MapLayerActions.setNetworkEquipmentSubtypeVisibility(layerType, layer, subtypeId, isVisible))
      },
      setTypeVisibility: (typeVisibility) => dispatch(MapLayerActions.setTypeVisibility(typeVisibility))
    }
  }

  mergeToTarget (nextState, actions) {
    const currentNetworkEquipmentLayers = this.networkEquipmentLayers
    const currentSelectedBoundaryType = this.selectedBoundaryType
    const currentShowSiteBoundary = this.showSiteBoundary
    const currentSelectedLibrary = this.dataItems && this.dataItems.equipment && this.dataItems.equipment.selectedLibraryItems

    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)

    const newSelectedLibrary = this.dataItems && this.dataItems.equipment && this.dataItems.equipment.selectedLibraryItems
    if ((currentNetworkEquipmentLayers !== nextState.networkEquipmentLayers) ||
      (currentSelectedBoundaryType !== nextState.selectedBoundaryType) ||
      (currentShowSiteBoundary !== nextState.showSiteBoundary) ||
      (currentSelectedLibrary !== newSelectedLibrary)) {
      this.updateMapLayers()
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }
}

NetworkEquipmentController.$inject = ['$rootScope', '$http', '$location', '$ngRedux', 'map_tools', 'state', 'rxState']

let networkEquipment = {
  templateUrl: '/components/views/network-equipment.html',
  bindings: {},
  controller: NetworkEquipmentController
}

export default networkEquipment
