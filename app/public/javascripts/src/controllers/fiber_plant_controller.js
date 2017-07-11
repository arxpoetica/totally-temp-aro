/* global app config $ _ google map */
// Fiber Plant Controller
app.controller('fiber_plant_controller', ['$scope', '$location', 'state', 'map_tools', ($scope, $location, state, map_tools) => {

  $scope.map_tools = map_tools
  $scope.planState = state

  // Sliders for testing different rendering modes
  $scope.minAggregatedValue = 0.0
  $scope.maxAggregatedValue = 1.0
  $scope.showBlockHeatMap = false

  // Update map layers based on the selections in the state object
  var baseUrl = $location.protocol() + '://' + $location.host() + ':' + $location.port();
  // Creates map layers based on selection in the UI
  var createdMapLayerKeys = new Set()
  var updateMapLayers = () => {

    // Make a copy of the state mapLayers. We will update this
    var oldMapLayers = angular.copy(state.mapLayers.getValue())

    // Remove all the map layers previously created by this controller
    createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })
    createdMapLayerKeys.clear()

    // Add map layers based on the selection
    var censusBlockUrls = []
    var mapLayerKey = `competitor_censusBlocks`
    state.competition.selectedCompetitors.forEach((selectedCompetitor) => {
      var carrierId = selectedCompetitor.id
      var providerType = state.competition.selectedCompetitorType.id
      var polyTransform = map.getZoom() > 12 ? 'select' : 'smooth'
      var lineTransform = map.getZoom() > 10 ? 'select' : 'smooth_absolute'

      if (state.competition.showCensusBlocks) {
        censusBlockUrls.push(`/tile/v1/competitive/nbm/carrier/${carrierId}/${providerType}/census-block/${polyTransform}/`)
      }
    })
    if (censusBlockUrls.length > 0) {
      var mapLayer = {
        url: censusBlockUrls,
        iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
        isVisible: true,
        drawingOptions: {
          strokeStyle: state.competition.selectedCompetitors[0].strokeStyle,
          fillStyle: state.competition.selectedCompetitors[0].fillStyle,
          showTileExtents: state.showMapTileExtents.getValue()
        },
        aggregateOptions: {
          // Hacking defaults 'census_block_gid'
          aggregateEntityId: state.competition.selectedRenderingOption.aggregateEntityId || 'census_block_gid',
          aggregateBy: state.competition.selectedRenderingOption.aggregateBy || 'census_block_gid'
        }
      }
      if (censusBlockUrls.length > 1 && state.competition.selectedRenderingOption.alphaRender) {
        // Make sure min/max aggregated values are correct
        var minAggregatedValue = Math.min($scope.minAggregatedValue, 0.99)
        var maxAggregatedValue = Math.max(0.01, $scope.maxAggregatedValue)
        if (maxAggregatedValue < minAggregatedValue) {
          $scope.maxAggregatedValue = maxAggregatedValue = minAggregatedValue + 0.01
        }
        mapLayer.drawingOptions.alphaThreshold = {
          property: state.competition.selectedRenderingOption.alphaThresholdProperty,
          minValue: minAggregatedValue,
          maxValue: maxAggregatedValue
        }
        mapLayer.drawingOptions.blockHeatMap = $scope.showBlockHeatMap
      }
      oldMapLayers[mapLayerKey] = mapLayer
      createdMapLayerKeys.add(mapLayerKey)
    }

    // "oldMapLayers" now contains the new layers. Set it in the state
    state.mapLayers.next(oldMapLayers)
  }


  // Called when the selected competitor type changes
  $scope.onCompetitorTypeChanged = () => {
    state.reloadCompetitors()
      .then(() => updateMapLayers())
  }

  $scope.onSelectedCompetitorsChanged = () => {
    updateMapLayers()
  }

  $scope.toggleShowSurveyData = () => {
    state.competition.showCensusBlocks = !state.competition.showCensusBlocks
    updateMapLayers()
  }

  $scope.toggleShowFiberRoutesData = () => {
    state.competition.showFiberRoutes = !state.competition.showFiberRoutes
    updateMapLayers()
  }

  $scope.toggleShowFiberRoutesBufferData = () => {
    state.competition.showFiberRoutesBuffer = !state.competition.showFiberRoutesBuffer
    updateMapLayers()
  }

  $scope.onRenderingChanged = () => {
    updateMapLayers()
  }

}])
