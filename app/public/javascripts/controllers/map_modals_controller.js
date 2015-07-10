// Map Modals Controller
app.controller('map_modals_controller', ['$scope', '$rootScope', '$http', 'sources', 'targets', 'MapLayer', function($scope, $rootScope, $http, sources, targets, MapLayer) {
  // Controller instance variables
  $scope.is_visible = false;
  $scope.sources = sources;
  $scope.targets = targets;

  /************
  * FUNCTIONS *
  *************/

  // Listen for visibility toggle to be broadcast through $rootScope from other controller (map_tools_controller)
  $rootScope.$on('toggle_tool_visibility', function() {
    $scope.is_visible = !$scope.is_visible;
  });
  
  $scope.create_route = function() {
  	var source = $scope.sources[0].vertex_id;
  	var target = $scope.targets[0].vertex_id;
    console.log('/route_optimizer/shortest_path/' + source + '/' + target);
    var route_layer_style = {
      strokeColor: 'red'
    };
    $scope.route_layer = new MapLayer('/route_optimizer/shortest_path/' + source + '/' + target, route_layer_style, map);
    $scope.route_layer.load_data();
    $scope.route_layer.apply_style();
    $scope.route_layer.data_layer.setMap(map);
    $scope.route_layer.visible = true;
  }

}]);