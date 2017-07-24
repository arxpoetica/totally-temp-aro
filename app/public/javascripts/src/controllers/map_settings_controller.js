/* global app $ globalServiceLayers swal _ */
app.controller('map_settings_controller', ['$scope','$rootScope','map_tools','state', ($scope,$rootScope,map_tools,state) => {
  $scope.map_tools = map_tools
  $scope.heatmapOn = true;
  $scope.state = state

  // Heatmap options
  $scope.selectedHeatmapOption = null

  // Data flow from state to controller
  state.viewSetting.selectedHeatmapOption
    .subscribe((newValue) => $scope.selectedHeatmapOption = newValue)

  // Data flow from controller to state
  $scope.onSelectedHeatmapOptionChanged = () => {
    state.viewSetting.selectedHeatmapOption.next($scope.selectedHeatmapOption)
  }

  state.viewSetting.selectedFiberOption = state.viewFiberOptions[0]

  $scope.fiberOptionChanged = () => {
    $rootScope.$broadcast("map_setting_changed" , {type : "fiber_option" , setting :  state.viewSetting.selectedFiberOption });
  }

  // Map tile settings used for debugging
  state.mapTileOptions
    .subscribe((mapTileOptions) => $scope.mapTileOptions = angular.copy(mapTileOptions))

  // Take the mapTileOptions defined in $scope and set it on the state
  $scope.updateState = () => {
    var newMapTileOptions = angular.copy($scope.mapTileOptions)
    state.mapTileOptions.next(newMapTileOptions)
  }

}]);
