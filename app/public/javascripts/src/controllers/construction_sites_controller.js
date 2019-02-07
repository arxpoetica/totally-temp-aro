/* global app _ config user_id $ map google randomColor tinycolor Chart swal */
// Construction Sites Controller
app.controller('construction_sites_controller', ['$scope', '$rootScope', 'map_tools', 'state', ($scope, $rootScope, map_tools, state) => {
  $scope.map_tools = map_tools
  $scope.selected_tool = null
  $scope.available_tools = [
    {
      key: 'commercial',
      name: 'Commercial'
    },
    {
      key: 'residential',
      name: 'Residential'
    },
    {
      key: 'combo',
      name: 'Combo'
    }
  ]

  $scope.available_tools = _.reject($scope.available_tools, (tool) => {
    return config.ui.map_tools.locations.build.indexOf(tool.key) === -1
  })

  $scope.roadLayer = {
    short_name: 'RS',
    name: 'Road Segments',
    type: 'road_segments',
    style_options: {
      normal: {
        strokeColor: 'teal',
        strokeWeight: 2
      },
      highlight: {
        strokeColor: '#b34d4d',
        strokeWeight: 4
      }
    },
    libraryId: 2,
    aggregateZoomThreshold: 15,
    visible: false,
    tileDefinition: {
      dataId: 'v1.tiles.edge.{libraryId}.{transform}',
      vtlType: 'EdgeLayer',
      libraryId: '{libraryId}',
      transform: '{transform}'
    },
    threshold: 12,
    reload: 'always'
  }

  if(config.ARO_CLIENT === 'frontier') {
    $scope.roadLayer.style_options.normal.strokeColor = '#ffffff'
    $scope.roadLayer.style_options.normal.strokeWeight = 5
    $scope.roadLayer.style_options.highlight.strokeWeight = 6
  }

  // When the map zoom changes, map layers can change
  $rootScope.$on('map_zoom_changed', updateMapLayers)
  
  $scope.toggleRoadLayer = () => {
    updateMapLayers()
  }

  // Replaces any occurrences of searchText by replaceText in the keys of an object
  var objectKeyReplace = (obj, searchText, replaceText) => {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(searchText, replaceText)
      }
    })
  }
  
  // Creates map layers based on selection in the UI
  var createdMapLayerKeys = new Set()
  var updateMapLayers = () => {

    // Make a copy of the state mapLayers. We will update this
    var oldMapLayers = angular.copy(state.mapLayers.getValue())

    // Remove all the map layers previously created by this controller
    createdMapLayerKeys.forEach((createdRoadMapLayerKey) => {
      delete oldMapLayers[createdRoadMapLayerKey]
    })

    createdMapLayerKeys.clear()

    // Hold a list of layers that we want merged
    var layer = $scope.roadLayer;
    var selectedEdgeLibraries = state.dataItems && state.dataItems.edge && state.dataItems.edge.selectedLibraryItems
    
    if(layer.visible && selectedEdgeLibraries) {
      selectedEdgeLibraries.forEach((selectedEdgeLibrary) => {
        // Location type is visible
        var mapZoom = map.getZoom()
        var pointTransform = (mapZoom > layer.aggregateZoomThreshold) ? 'select' : 'smooth_relative'
        var mapLayerKey = `${pointTransform}_${layer.type}_${selectedEdgeLibrary.identifier}`

        var tileDefinition = angular.copy(layer.tileDefinition)
        objectKeyReplace(tileDefinition, '{libraryId}', selectedEdgeLibrary.identifier)
        objectKeyReplace(tileDefinition, '{transform}', pointTransform)

        oldMapLayers[mapLayerKey] = {
          tileDefinitions: [tileDefinition],
          renderMode: 'PRIMITIVE_FEATURES',
          selectable: true,
          drawingOptions: {
            strokeStyle: layer.style_options.normal.strokeColor,
            lineWidth: layer.style_options.normal.strokeWeight
          },
          highlightStyle: {
            lineWidth: layer.style_options.highlight.strokeWeight,
            strokeStyle: layer.style_options.highlight.strokeColor
          },
          fillStyle: "transparent",
          zIndex: 4500, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
          opacity: 0.7
        }
        createdMapLayerKeys.add(mapLayerKey)
      })
    }

    // "oldMapLayers" now contains the new layers. Set it in the state
    state.mapLayers.next(oldMapLayers)
  }

  // Update map layers when the dataItems property of state changes
  state.dataItemsChanged
    .skip(1)
    .subscribe((newValue) => updateMapLayers())
}])
