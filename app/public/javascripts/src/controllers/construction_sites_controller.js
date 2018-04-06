/* global app _ config user_id $ map google randomColor tinycolor Chart swal */
// Construction Sites Controller
app.controller('construction_sites_controller', ['$scope', '$rootScope', '$http', 'configuration', 'map_tools', 'map_layers', 'MapLayer', 'CustomOverlay', 'tracker', 'optimization', 'state', ($scope, $rootScope, $http, configuration, map_tools, map_layers, MapLayer, CustomOverlay, tracker, optimization, state) => {
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
    api_endpoint: '/tile/v1/edge/tiles/${libraryId}/${lineTransform}/',
    threshold: 12,
    reload: 'always'
  }

  // When the map zoom changes, map layers can change
  $rootScope.$on('map_zoom_changed', updateRoadMapLayers)
  
  $scope.toggleRoadLayer = () => {
    updateRoadMapLayers()
  }

  // Creates map layers based on selection in the UI
  var createdRoadMapLayerKeys = new Set()
  var updateRoadMapLayers = () => {

    // Make a copy of the state mapLayers. We will update this
    var oldRoadMapLayers = angular.copy(state.mapLayers.getValue())

    // Remove all the map layers previously created by this controller
    createdRoadMapLayerKeys.forEach((createdRoadMapLayerKey) => {
      delete oldRoadMapLayers[createdRoadMapLayerKey]
    })

    createdRoadMapLayerKeys.clear()

    // Hold a list of layers that we want merged
    var mergedLayerUrls = []
    var layer = $scope.roadLayer;
    var selectedEdgeLibraries = state.dataItems && state.dataItems.edge && state.dataItems.edge.selectedLibraryItems
    
    if(layer.visible && selectedEdgeLibraries) {
      selectedEdgeLibraries.forEach((selectedEdgeLibrary) => {
        // Location type is visible
        var mapZoom = map.getZoom()
        var pointTransform = (mapZoom > layer.aggregateZoomThreshold) ? 'select' : 'smooth_relative'
        var mapLayerKey = `${pointTransform}_${layer.type}_${selectedEdgeLibrary.identifier}`

        var url = layer.api_endpoint.replace('${lineTransform}', pointTransform)
        url = url.replace('${libraryId}', selectedEdgeLibrary.identifier)

        if (pointTransform === 'smooth_relative') {
          // For aggregated locations (all types - businesses, households, celltowers) we want to merge them into one layer
          mergedLayerUrls.push(url)
        } else {
          // We want to create an individual layer
          oldRoadMapLayers[mapLayerKey] = {
            dataUrls: [url],
            renderMode: 'PRIMITIVE_FEATURES',
            selectable: true,
            strokeStyle: layer.style_options.normal.strokeColor,
            lineWidth: layer.style_options.normal.strokeWeight,
            highlightStyle: {
              lineWidth: layer.style_options.highlight.strokeWeight,
              strokeStyle: layer.style_options.highlight.strokeColor
            },
            fillStyle: "transparent",
            zIndex: 4500, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
            opacity: 0.7
          }
          createdRoadMapLayerKeys.add(mapLayerKey)
        }

        if (mergedLayerUrls.length > 0) {
          // We have some business layers that need to be merged into one
          // We still have to specify an iconURL in case we want to debug the heatmap rendering. Pick any icon.
          oldRoadMapLayers[mapLayerKey] = {
            dataUrls: mergedLayerUrls,
            renderMode: 'HEATMAP',
            selectable: true,
            aggregateMode: 'FLATTEN',
            strokeStyle: layer.style_options.normal.strokeColor,
            lineWidth: layer.style_options.normal.strokeWeight,
            highlightStyle: {
              lineWidth: layer.style_options.highlight.strokeWeight,
              strokeStyle: layer.style_options.highlight.strokeColor
            },
            fillStyle: "transparent",
            zIndex: 4500, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
            opacity: 0.7
          }
          createdRoadMapLayerKeys.add(mapLayerKey)
        }
      })
    }

    // "oldMapLayers" now contains the new layers. Set it in the state
    state.mapLayers.next(oldRoadMapLayers)
  }

  // Update map layers when the dataItems property of state changes
  state.dataItemsChanged
  .subscribe((newValue) => updateRoadMapLayers())

}])
