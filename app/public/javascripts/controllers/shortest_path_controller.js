// Shortest Path Controller
app.controller('shortest_path_controller', ['$scope', '$rootScope', '$http', 'sources', 'targets', 'MapLayer', function($scope, $rootScope, $http, sources, targets, MapLayer) {
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
  
  // Handles one source and many targets.
  $scope.create_route = function() {
  	var source = $scope.sources[0]
  	var targets = $scope.targets;
    var cost_multiplier = 200.0; // This will eventually be a user input which will vary
    console.log('/route_optimizer/shortest_path/' + source + '/' + targets + '/' + cost_multiplier);

    var route_layer_style = {
      strokeColor: 'red'
    };
    
    $scope.route_layer = new MapLayer('/route_optimizer/shortest_path/' + source + '/' + targets + '/' + cost_multiplier, route_layer_style, map);

    if (!$scope.route_layer.data_loaded) {
      $scope.route_layer.load_data().then(function(data) {
        $scope.route_layer.data_layer.addGeoJson(data.feature_collection);
        $scope.route_layer.metadata = data.metadata;
        $scope.route_layer.data_loaded = true;
        console.log($scope.route_layer.metadata);
      });
    }
    
    $scope.route_layer.apply_style();
    $scope.route_layer.data_layer.setMap(map);
    $scope.route_layer.visible = true;
  }

}]);