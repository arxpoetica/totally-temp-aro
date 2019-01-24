/* global app user_id config map _ google swal config $ globalServiceLayers */
// Equipment Nodes Controller
app.controller('equipment_nodes_controller', ['$scope', '$rootScope', '$http', '$location', 'map_tools', 'MapLayer', '$timeout', 'optimization', 'state', ($scope, $rootScope, $http, $location, map_tools, MapLayer, $timeout, optimization, state) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.state = state
  $scope.currentUser = state.loggedInUser
  $scope.mapZoom = 0//map.getZoom()
  $scope.equ_tdc_order = ['central_office','splice_point','fiber_distribution_hub','fiber_distribution_terminal','multiple_dwelling_unit','bulk_distribution_terminal','dslam','cell_5g','loop_extender','network_anchor']
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
        obj[key] = obj[key].replace(searchText, replaceText)  // TODO: Parag - Do replaceAll correctly
      }
    })
  }

  // Creates a single map layer by substituting tileDefinition parameters
  var createSingleMapLayer = (equipmentOrFiberKey, categoryType, networkEquipment, existingOrPlanned, libraryId, rootPlanId) => {

    var existingOrPlannedzIndex = state.configuration.networkEquipment.tileDefinitions[categoryType][existingOrPlanned].zIndex
    delete state.configuration.networkEquipment.tileDefinitions[categoryType][existingOrPlanned].zIndex
    var tileDefinition = angular.copy(state.configuration.networkEquipment.tileDefinitions[categoryType][existingOrPlanned])
    objectKeyReplace(tileDefinition, '{networkNodeType}', equipmentOrFiberKey)
    objectKeyReplace(tileDefinition, '{fiberType}', equipmentOrFiberKey)
    objectKeyReplace(tileDefinition, '{libraryId}', libraryId)
    objectKeyReplace(tileDefinition, '{rootPlanId}', rootPlanId)

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

    // For equipments, we are going to filter out features that are planned and deleted
    var featureFilter = null
    var drawingOptions = angular.copy(networkEquipment.drawingOptions)
    if (categoryType === 'equipment') {
      featureFilter = (feature) => {
        // For now, just hide equipment features that are Planned and Deleted
        return (!feature.properties.deployment_type
          || (feature.properties.deployment_type === 1)
          || (feature.properties.is_deleted !== 'true'))
      }
      if (state.showEquipmentLabels && map.getZoom() > state.configuration.networkEquipment.labelDrawingOptions.visibilityZoomThreshold) {
        drawingOptions.labels = state.configuration.networkEquipment.labelDrawingOptions
      }
    } else if (categoryType === 'boundaries') {
      featureFilter = (feature) => {
        // Show boundaries with the currently selected boundary type AND that are not marked as deleted
        return (feature.properties.boundary_type === state.selectedBoundaryType.id)
               && (feature.properties.is_deleted !== 'true')
      }
    }
    return {
      tileDefinitions: [tileDefinition],
      iconUrl: networkEquipment.iconUrl, 
      greyOutIconUrl: networkEquipment.greyOutIconUrl,
      renderMode: 'PRIMITIVE_FEATURES',   // Always render equipment nodes as primitives
      featureFilter: featureFilter,
      strokeStyle: networkEquipment.drawingOptions.strokeStyle,
      lineWidth: networkEquipment.drawingOptions.lineWidth || 2,
      fillStyle: networkEquipment.drawingOptions.fillStyle,
      opacity: networkEquipment.drawingOptions.opacity || 0.5,
      drawingOptions: drawingOptions,
      selectable: true,
      zIndex: networkEquipment.zIndex + (existingOrPlannedzIndex ? existingOrPlannedzIndex : 0),
      showPolylineDirection: networkEquipment.drawingOptions.showPolylineDirection && state.showDirectedCable, //Showing Direction
      highlightStyle: networkEquipment.highlightStyle
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
        
        if (state.equipmentLayerTypeVisibility.existing && networkEquipment.checked) {
          // We need to show the existing network equipment. Loop through all the selected library ids.
          state.dataItems && state.dataItems[networkEquipment.dataItemKey] 
            && state.dataItems[networkEquipment.dataItemKey].selectedLibraryItems.forEach((selectedLibraryItem) => {
            var mapLayerKey = `${categoryItemKey}_existing_${selectedLibraryItem.identifier}`
            mapLayers[mapLayerKey] = createSingleMapLayer(categoryItemKey, categoryType, networkEquipment, 'existing', selectedLibraryItem.identifier, null)
            createdMapLayerKeys.add(mapLayerKey)
          })
        }
  
        const planId = state.plan && state.plan.getValue() && state.plan.getValue().id
        if (state.equipmentLayerTypeVisibility.planned && networkEquipment.checked && planId) {
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
  $scope.updateMapLayers = () => {
    // Make a copy of the state mapLayers. We will update this
    var oldMapLayers = angular.copy(state.mapLayers.getValue())

    // Remove all the map layers previously created by this controller
    createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })

    if(config.ARO_CLIENT === 'tdc') {
      var equ = angular.copy(state.configuration.networkEquipment.equipments)
      state.configuration.networkEquipment.equipments = {}
      $scope.equ_tdc_order.forEach((key) => {
        state.configuration.networkEquipment.equipments[key] = equ[key]
      })
    }

    // Create layers for network equipment nodes and cables
    createdMapLayerKeys.clear()
    createMapLayersForCategory(state.configuration.networkEquipment.equipments, 'equipment', oldMapLayers, createdMapLayerKeys);
    createMapLayersForCategory(state.configuration.networkEquipment.cables, 'cable', oldMapLayers, createdMapLayerKeys);
    // Hack to check/uncheck site boundaries based on view settings
    Object.keys(state.configuration.networkEquipment.boundaries).forEach((boundaryKey) => {
      var selectedBoundaryName
      state.selectedBoundaryType.name !== 'fiveg_coverage' ? selectedBoundaryName = 'siteBoundaries' : selectedBoundaryName = 'fiveg_coverage'
      if(boundaryKey === 'siteBoundaries') {
        state.configuration.networkEquipment.boundaries[boundaryKey].checked = (state.showSiteBoundary && boundaryKey === selectedBoundaryName)
      } else if (boundaryKey === 'fiveg_coverage') {
        state.configuration.networkEquipment.boundaries[boundaryKey].checked = (state.showSiteBoundary && boundaryKey === selectedBoundaryName
          && state.configuration.networkEquipment.equipments['cell_5g'].checked)
      }
    })

    // Hack to show copper in toolbar ruler options
    Object.keys(state.configuration.networkEquipment.cables).forEach((cable) => {
      if(cable === 'COPPER' && state.configuration.networkEquipment.cables['COPPER'].checked) {  
        state.rulerActions.indexOf(state.allRulerActions.COPPER) === -1 && state.rulerActions.push(state.allRulerActions.COPPER)
      } else if (cable === 'COPPER' && !state.configuration.networkEquipment.cables['COPPER'].checked){
        var index = state.rulerActions.indexOf(state.allRulerActions.COPPER)
        index !== -1 && state.rulerActions.splice(index, 1)
      }
    })
    createMapLayersForCategory(state.configuration.networkEquipment.boundaries, 'boundaries', oldMapLayers, createdMapLayerKeys)

    // "oldMapLayers" now contains the new layers. Set it in the state
    state.mapLayers.next(oldMapLayers)
  }
  // When the map zoom changes, map layers can change
  $rootScope.$on('map_zoom_changed', $scope.updateMapLayers)

  // Change the visibility of a network equipment layer. layerObj should refer to an object
  // in state.js --> networkEquipments[x].layers
  $scope.changeLayerVisibility = (layerObj, isVisible) => {
    // "visibilityType" allows us to distinguish between planned and existing layers
    layerObj.checked = isVisible
    $scope.updateMapLayers()
  }

  $scope.zoomTo = (zoomLevel) => { 
    zoomLevel = Number(zoomLevel) + 1
    //console.log(zoomLevel)
    state.requestSetMapZoom.next(zoomLevel)
  }

  $scope.getBackgroungColor = (layer) => {
    return layer.drawingOptions.strokeStyle
  }
  
  // Create a new set of map layers
  state.mapReadyPromise.then(() => {
    $scope.updateMapLayers()
  })

  // Update map layers when the dataItems property of state changes
  state.dataItemsChanged
    .skip(1)
    .subscribe((newValue) => {
      $scope.updateMapLayers()
    })

  // Update map layers when the dataItems property of state changes
  state.viewSettingsChanged
    .skip(1)
    .subscribe(() => {
      $scope.updateMapLayers()
    })
}])