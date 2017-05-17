/* global app $ globalServiceLayers swal _ */
app.controller('map_settings_controller', ['$scope','map_tools','state', ($scope,map_tools,state) => {
  $scope.map_tools = map_tools
  $scope.heatmapOn = true;
  $scope.fiberOptions = [
    {
      id : 1,
      name : "Uniform width"
    }
  ];

  $scope.selectedFO = $scope.fiberOptions[0];

  $scope.toggleHeatmap = ()=>{
    var locationsLayer = state.locations_layer;
    if (!$scope.heatmapOn) {
      locationsLayer.setThreshold(0)
    } else {
      locationsLayer.setThreshold(15)
    }
  }
}]);
