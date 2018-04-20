/* global app user_id config map _ google swal config $ globalServiceLayers globalExistingFiberSourceNames */
// Equipment Nodes Controller
app.controller('equipment_nodes_controller', ['$scope', '$rootScope', '$http', '$location', 'map_tools', 'MapLayer', '$timeout', 'optimization', 'state', 'configuration', ($scope, $rootScope, $http, $location, map_tools, MapLayer, $timeout, optimization, state, configuration) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.configuration = configuration
  $scope.planState = state
  $scope.layerTypeVisibility = {
    existing: false,
    planned: false
  }

  // Get the point transformation mode with the current zoom level
  var getPointTransformForLayer = (zoomThreshold) => {
    var mapZoom = map.getZoom()
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoom > zoomThreshold) ? 'select' : 'aggregate'
  }

  // Get the line transformation mode with the current zoom level
  var getLineTransformForLayer = (zoomThreshold) => {
    var mapZoom = map.getZoom()
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoom > zoomThreshold) ? 'select' : 'smooth_absolute'
  }

  // Get the polygon transformation mode with the current zoom level
  var getPolygonTransformForLayer = (zoomThreshold) => {
    var mapZoom = map.getZoom()
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoom > zoomThreshold) ? 'select' : 'smooth'
  }

  var baseUrl = $location.protocol() + '://' + $location.host() + ':' + $location.port();

  // Creates a single map layer by substituting tileUrl parameters
  var createSingleMapLayer = (equipmentKey, networkEquipment, tileUrlType, libraryId, rootPlanId) => {
    var tileUrl = networkEquipment[tileUrlType]
    tileUrl = tileUrl.replace('{libraryId}', libraryId)
    tileUrl = tileUrl.replace('{rootPlanId}', rootPlanId)
    tileUrl = tileUrl.replace('{boundaryTypeId}', state.selectedBoundaryType.id)
    if (networkEquipment.equipmentType === 'point') {
      var pointTransform = getPointTransformForLayer(+networkEquipment.aggregateZoomThreshold)
      tileUrl = tileUrl.replace('{pointTransform}', pointTransform)
    } else if (networkEquipment.equipmentType === 'line') {
      var lineTransform = getLineTransformForLayer(+networkEquipment.aggregateZoomThreshold)
      tileUrl = tileUrl.replace('{lineTransform}', lineTransform)
    } else if (networkEquipment.equipmentType === 'polygon') {
      var polygonTransform = getPolygonTransformForLayer(+networkEquipment.aggregateZoomThreshold)
      tileUrl = tileUrl.replace('{polyTransform}', polygonTransform)
    }
    var polygonTransform = getPolygonTransformForLayer(+networkEquipment.aggregateZoomThreshold)
    tileUrl = tileUrl.replace('{polyTransform}', polygonTransform)
    return {
      dataUrls: [tileUrl],
      iconUrl: networkEquipment.iconUrl,
      renderMode: 'PRIMITIVE_FEATURES',   // Always render equipment nodes as primitives
      strokeStyle: networkEquipment.drawingOptions.strokeStyle,
      lineWidth: 2,
      fillStyle: networkEquipment.drawingOptions.fillStyle,
      opacity: networkEquipment.drawingOptions.opacity || 0.5,
      selectable: true,
      zIndex: networkEquipment.zIndex,
      showPolylineDirection: networkEquipment.drawingOptions.showPolylineDirection && state.showDirectedCable //Showing Direction
    }
  }

  // Creates map layers for a specified category (e.g. "equipment")
  var createMapLayersForCategory = (categoryItems, mapLayers, createdMapLayerKeys) => {
    // First loop through all the equipment types (e.g. central_office)
    Object.keys(categoryItems).forEach((categoryItemKey) => {
      var networkEquipment = categoryItems[categoryItemKey]
      if ($scope.layerTypeVisibility.existing && networkEquipment.checked) {
        // We need to show the existing network equipment. Loop through all the selected library ids.
        state.dataItems[networkEquipment.dataItemKey].selectedLibraryItems.forEach((selectedLibraryItem) => {
          var mapLayerKey = `${categoryItemKey}_existing_${selectedLibraryItem.identifier}`
          mapLayers[mapLayerKey] = createSingleMapLayer(categoryItemKey, networkEquipment, 'existingTileUrl', selectedLibraryItem.identifier, null)
          createdMapLayerKeys.add(mapLayerKey)
          if (networkEquipment.existingBoundaryTileUrl && state.showSiteBoundary) {
            var mapLayerKeyBoundary = `${categoryItemKey}_existing_${selectedLibraryItem.identifier}_boundary`
            mapLayers[mapLayerKeyBoundary] = createSingleMapLayer(categoryItemKey, networkEquipment, 'existingBoundaryTileUrl', selectedLibraryItem.identifier, null)
            createdMapLayerKeys.add(mapLayerKeyBoundary)
          }
        })
      }

      const planId = state.plan && state.plan.getValue() && state.plan.getValue().id
      if ($scope.layerTypeVisibility.planned && networkEquipment.checked && planId) {
        // We need to show the planned network equipment for this plan.
        var mapLayerKey = `${categoryItemKey}_planned`
        mapLayers[mapLayerKey] = createSingleMapLayer(categoryItemKey, networkEquipment, 'plannedTileUrl', null, planId)
        createdMapLayerKeys.add(mapLayerKey)
      }
    })
  }

  // Creates map layers based on selection in the UI
  var createdMapLayerKeys = new Set()
  var updateMapLayers = () => {

    if (!$scope.configuration || !$scope.configuration.networkEquipment) {
      return
    }

    // Make a copy of the state mapLayers. We will update this
    var oldMapLayers = angular.copy(state.mapLayers.getValue())

    // Remove all the map layers previously created by this controller
    createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })

    // Create layers for network equipment nodes and cables
    createdMapLayerKeys.clear()
    createMapLayersForCategory($scope.configuration.networkEquipment.equipments, oldMapLayers, createdMapLayerKeys);
    createMapLayersForCategory($scope.configuration.networkEquipment.cables, oldMapLayers, createdMapLayerKeys);

    // Create layer for site boundaries
    const planId = state.plan && state.plan.getValue() && state.plan.getValue().id
    if (state.showSiteBoundary && state.selectedBoundaryType && planId) {
      const mapLayerKey = `site_boundaries_${state.selectedBoundaryType.id}_${planId}`
      var boundaryDefinition = $scope.configuration.networkEquipment.siteBoundaries
      var tileUrl = boundaryDefinition.tileUrl
      tileUrl = tileUrl.replace('{boundaryTypeId}', state.selectedBoundaryType.id)
      tileUrl = tileUrl.replace('{rootPlanId}', planId)
      const polygonTransform = getPolygonTransformForLayer(+boundaryDefinition.aggregateZoomThreshold)
      // {pointTransform} for polygon??? Thats how it is currently coded in service
      tileUrl = tileUrl.replace('{pointTransform}', polygonTransform)
      oldMapLayers[mapLayerKey] = {
        dataUrls: [tileUrl],
        iconUrl: boundaryDefinition.iconUrl,
        renderMode: 'PRIMITIVE_FEATURES',   // Always render equipment nodes as primitives
        strokeStyle: boundaryDefinition.drawingOptions.strokeStyle,
        lineWidth: 2,
        fillStyle: boundaryDefinition.drawingOptions.fillStyle,
        opacity: 0.5,
        selectable: true,
        zIndex: boundaryDefinition.zIndex,
        showPolylineDirection: boundaryDefinition.drawingOptions.showPolylineDirection && state.showDirectedCable //Showing Direction
      }
      createdMapLayerKeys.add(mapLayerKey)
    }

    // "oldMapLayers" now contains the new layers. Set it in the state
    state.mapLayers.next(oldMapLayers)
  }
  // When the map zoom changes, map layers can change
  $rootScope.$on('map_zoom_changed', updateMapLayers)

  // Change the visibility of a network equipment layer. layerObj should refer to an object
  // in state.js --> networkEquipments[x].layers
  $scope.changeLayerVisibility = (layerObj, isVisible) => {
    // "visibilityType" allows us to distinguish between planned and existing layers
    layerObj.checked = isVisible
    updateMapLayers()
  }

  // When the type (existing, planned) changes, update map layers
  $scope.setLayerTypeVisibility = (type, newValue) => {
    $scope.layerTypeVisibility[type] = newValue
    updateMapLayers()
  }

  // Create a new set of map layers
  state.appReadyPromise.then(() => {
    updateMapLayers()
  })

  // Update map layers when the dataItems property of state changes
  state.dataItemsChanged
    .subscribe((newValue) => updateMapLayers())

  // Update map layers when the dataItems property of state changes
  state.viewSettingsChanged
  .subscribe(() => updateMapLayers())
}])