/* global app $ globalServiceLayers swal _ */
app.controller('map_settings_controller', ['$scope','$rootScope','map_tools','state', ($scope,$rootScope,map_tools,state) => {
  $scope.map_tools = map_tools
  $scope.heatmapOn = true;
  $scope.fiberOptions = [
    {
      id : 1,
      name : "Uniform width"
    },
    {
      id : 2,
      name : "Fiber Strand Count",
      field : "fiber_strands",
      multiplier : 6
    },
    {
      id : 3,
      name : "Atomic Unit Demand",
      field : "atomic_units",
      multiplier: 1
    }
  ];

  $scope.selectedFO = state.selected_fiber_option= $scope.fiberOptions[0];

  $scope.toggleHeatmap = ()=>{
    var locationsLayer = state.locations_layer;
    if (!$scope.heatmapOn) {
      locationsLayer.setThreshold(0)
    } else {
      locationsLayer.setThreshold(15)
    }
  }

  $scope.fiberOptionChanged = ()=>{
    state.selected_fiber_option = $scope.selectedFO;
    $rootScope.$broadcast("map_setting_changed" , {type : "fiber_option" , setting : state.selected_fiber_option});
  }

}]);
