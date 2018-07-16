/* global app user_id config map _ google swal config $ globalServiceLayers globalExistingFiberSourceNames */
// Equipment Nodes Controller
app.controller('equipment_nodes_controller', ['$scope', '$rootScope', '$http', '$location', 'map_tools', 'MapLayer', '$timeout', 'optimization', 'state', 'configuration', ($scope, $rootScope, $http, $location, map_tools, MapLayer, $timeout, optimization, state, configuration) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.configuration = configuration
  $scope.planState = state
  $scope.currentUser = state.loggedInUser
  $scope.layerTypeVisibility = {
    existing: false,
    planned: false
  }
  if (configuration.networkEquipment) {
    $scope.layerTypeVisibility.existing = configuration.networkEquipment.visibility.defaultShowExistingEquipment
    $scope.layerTypeVisibility.planned = configuration.networkEquipment.visibility.defaultShowPlannedEquipment
  }
  $scope.mapZoom = 0//map.getZoom()
  
  var usePointAggregate = false // aggregating multiple pieces of equipment under one marker causes problems with Equipment Selection
  
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
  // Replaces any occurrences of searchText by replaceText in the keys of an object
  var objectKeyReplace = (obj, searchText, replaceText) => {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(searchText, replaceText)
      }
    })
  }

  // Creates a single map layer by substituting tileDefinition parameters
  var createSingleMapLayer = (equipmentOrFiberKey, categoryType, networkEquipment, existingOrPlanned, libraryId, rootPlanId) => {

    var tileDefinition = angular.copy($scope.configuration.networkEquipment.tileDefinitions[categoryType][existingOrPlanned])
    objectKeyReplace(tileDefinition, '{networkNodeType}', equipmentOrFiberKey)
    objectKeyReplace(tileDefinition, '{fiberType}', equipmentOrFiberKey)
    objectKeyReplace(tileDefinition, '{libraryId}', libraryId)
    objectKeyReplace(tileDefinition, '{rootPlanId}', rootPlanId)
    objectKeyReplace(tileDefinition, '{boundaryTypeId}', state.selectedBoundaryType.id)

    if (networkEquipment.equipmentType === 'point') {
      var pointTransform = getPointTransformForLayer(+networkEquipment.aggregateZoomThreshold)
      objectKeyReplace(tileDefinition, '{pointTransform}', pointTransform)
    } else if (networkEquipment.equipmentType === 'line') {
      var lineTransform = getLineTransformForLayer(+networkEquipment.aggregateZoomThreshold)
      objectKeyReplace(tileDefinition, '{lineTransform}', lineTransform)
    } else if (networkEquipment.equipmentType === 'polygon') {
      var polygonTransform = getPolygonTransformForLayer(+networkEquipment.aggregateZoomThreshold)
      objectKeyReplace(tileDefinition, '{polygonTransform}', polygonTransform)
    }
    return {
      tileDefinitions: [tileDefinition],
      iconUrl: networkEquipment.iconUrl, 
      greyOutIconUrl: networkEquipment.greyOutIconUrl,
      renderMode: 'PRIMITIVE_FEATURES',   // Always render equipment nodes as primitives
      strokeStyle: networkEquipment.drawingOptions.strokeStyle,
      lineWidth: networkEquipment.drawingOptions.lineWidth || 2,
      fillStyle: networkEquipment.drawingOptions.fillStyle,
      opacity: networkEquipment.drawingOptions.opacity || 0.5,
      selectable: true,
      zIndex: networkEquipment.zIndex,
      showPolylineDirection: networkEquipment.drawingOptions.showPolylineDirection && state.showDirectedCable //Showing Direction
    }
  }

  // Creates map layers for a specified category (e.g. "equipment")
  var createMapLayersForCategory = (categoryItems, categoryType, mapLayers, createdMapLayerKeys) => {
    // First loop through all the equipment types (e.g. central_office)
    $scope.mapZoom = map.getZoom()
    Object.keys(categoryItems).forEach((categoryItemKey) => {
      var networkEquipment = categoryItems[categoryItemKey]
      
      if ('point' !== networkEquipment.equipmentType
          || usePointAggregate
          || $scope.mapZoom > networkEquipment.aggregateZoomThreshold) {
        
        if ($scope.layerTypeVisibility.existing && networkEquipment.checked) {
          // We need to show the existing network equipment. Loop through all the selected library ids.
          state.dataItems && state.dataItems[networkEquipment.dataItemKey] 
            && state.dataItems[networkEquipment.dataItemKey].selectedLibraryItems.forEach((selectedLibraryItem) => {
            var mapLayerKey = `${categoryItemKey}_existing_${selectedLibraryItem.identifier}`
            mapLayers[mapLayerKey] = createSingleMapLayer(categoryItemKey, categoryType, networkEquipment, 'existing', selectedLibraryItem.identifier, null)
            createdMapLayerKeys.add(mapLayerKey)
          })
        }
  
        const planId = state.plan && state.plan.getValue() && state.plan.getValue().id
        if ($scope.layerTypeVisibility.planned && networkEquipment.checked && planId) {
          // We need to show the planned network equipment for this plan.
          var mapLayerKey = `${categoryItemKey}_planned`
          mapLayers[mapLayerKey] = createSingleMapLayer(categoryItemKey, categoryType, networkEquipment, 'planned', null, planId)
          createdMapLayerKeys.add(mapLayerKey)
        }
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
    createMapLayersForCategory($scope.configuration.networkEquipment.equipments, 'equipment', oldMapLayers, createdMapLayerKeys);
    createMapLayersForCategory($scope.configuration.networkEquipment.cables, 'cable', oldMapLayers, createdMapLayerKeys);
    // Hack to check/uncheck site boundaries based on view settings
    Object.keys($scope.configuration.networkEquipment.boundaries).forEach((boundaryKey) => {
      var selectedBoundaryName
      state.selectedBoundaryType.name !== 'fiveg_coverage' ? selectedBoundaryName = 'siteBoundaries' : selectedBoundaryName = 'fiveg_coverage'
      if(boundaryKey === 'siteBoundaries') {
        $scope.configuration.networkEquipment.boundaries[boundaryKey].checked = (state.showSiteBoundary && boundaryKey === selectedBoundaryName)
      } else if (boundaryKey === 'fiveg_coverage') {
        $scope.configuration.networkEquipment.boundaries[boundaryKey].checked = (state.showSiteBoundary && boundaryKey === selectedBoundaryName
          && $scope.configuration.networkEquipment.equipments['cell_5g'].checked)
      }
    })

    // // Hack to show copper in toolbar ruler options
    // Object.keys($scope.configuration.networkEquipment.cables).forEach((cable) => {
    //   if(cable === 'copper' && $scope.configuration.networkEquipment.cables['copper'].checked) {  
    //     state.rulerActions.indexOf(state.allRulerActions.COPPER) === -1 && state.rulerActions.push(state.allRulerActions.COPPER)
    //   } else if (cable === 'copper' && !$scope.configuration.networkEquipment.cables['copper'].checked){
    //     var index = state.rulerActions.indexOf(state.allRulerActions.COPPER)
    //     index !== -1 && state.rulerActions.splice(index, 1)
    //   }
    // })
    // createMapLayersForCategory($scope.configuration.networkEquipment.boundaries, oldMapLayers, createdMapLayerKeys)

    // "oldMapLayers" now contains the new layers. Set it in the state
    state.mapLayers.next(oldMapLayers)
  }
  // When the map zoom changes, map layers can change
  $rootScope.$on('map_zoom_changed', updateMapLayers)

  // If configuration is loaded again, update default visibility of "show existing equipment"
  $rootScope.$on('configuration_loaded', () => {
    $scope.layerTypeVisibility.existing = configuration.networkEquipment.visibility.defaultShowExistingEquipment
    $scope.layerTypeVisibility.planned = configuration.networkEquipment.visibility.defaultShowPlannedEquipment
    updateMapLayers()
    $timeout()
  })

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
  
  $scope.zoomTo = (zoomLevel) => { 
    zoomLevel = Number(zoomLevel) + 1
    //console.log(zoomLevel)
    state.requestSetMapZoom.next(zoomLevel)
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