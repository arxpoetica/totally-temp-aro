/* global app $ globalServiceLayers swal _ */
app.controller('map_settings_controller', ['$scope','$rootScope','map_tools','state', ($scope,$rootScope,map_tools,state) => {
  $scope.map_tools = map_tools
  $scope.heatmapOn = true;
  $scope.state = state

  state.viewSetting.selectedFiberOption = state.viewFiberOptions[0]

  $scope.toggleHeatmap = ()=>{
    var locationsLayer = state.locations_layer;
    if (!$scope.heatmapOn) {
      locationsLayer.setThreshold(0)
    } else {
      locationsLayer.setThreshold(15)
    }
  }

  $scope.fiberOptionChanged = () => {
    $rootScope.$broadcast("map_setting_changed" , {type : "fiber_option" , setting :  state.viewSetting.selectedFiberOption });
  }

  // Checkbox to show/hide map tile extents. Used for debugging
  state.mapTileOptions
    .subscribe((mapTileOptions) => $scope.showMapTileExtents = mapTileOptions.showTileExtents)

  $scope.setShowMapTileExtents = (showMapTileExtents) => {
    var newState = angular.copy(state.mapTileOptions.getValue())
    newState.showTileExtents = showMapTileExtents
    state.mapTileOptions.next(newState)
  }
}]);
