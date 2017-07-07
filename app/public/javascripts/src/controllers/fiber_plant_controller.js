/* global app config $ _ google map */
// Fiber Plant Controller
app.controller('fiber_plant_controller', ['$scope', '$location', 'state', 'map_tools', ($scope, $location, state, map_tools) => {

  $scope.map_tools = map_tools
  $scope.planState = state

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
    state.competition.selectedCompetitors.forEach((selectedCompetitor) => {
      // Create census block layer
      if (state.competition.showCensusBlocks) {
        var carrierId = selectedCompetitor.id
        var providerType = state.competition.selectedCompetitorType.id
        var polyTransform = map.getZoom() > 14 ? 'select' : 'smooth'
        var mapLayerKey = `competitor_censusBlocks_${providerType}_${carrierId}`
        oldMapLayers[mapLayerKey] = {
          url: `/tile/v1/competitive/carrier/${carrierId}/${providerType}/census-block/${polyTransform}/`,
          iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
          isVisible: true,
          drawingOptions: {
            strokeStyle: '#00ff00',
            fillStyle: '#a0ffa0',
            showTileExtents: state.showMapTileExtents.getValue()
          }
        }
        createdMapLayerKeys.add(mapLayerKey)
      }
    })
    // "oldMapLayers" now contains the new layers. Set it in the state
    state.mapLayers.next(oldMapLayers)
  }


  // Called when the selected competitor type changes
  $scope.onCompetitorTypeChanged = () => {
    state.reloadCompetitors()
  }

  $scope.onSelectedCompetitorsChanged = () => {
    updateMapLayers()
  }

}])
