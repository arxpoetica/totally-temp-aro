// Network Planning Controller
app.controller('network-planning-controller', ['$scope', '$rootScope', 'network_planning', 'map_tools', '$http', function($scope, $rootScope, network_planning, map_tools, $http) {
  // Controller instance variables
  $scope.map_tools = map_tools;
  $scope.route = null;

  var descriptions = {
    'fttp': 'FTTP',
    'shortest_path': 'Shortest path',
  };

  $scope.algorithms = network_planning.algorithms();
  $scope.algorithm = network_planning.getAlgorithm();

  $scope.change_algorithm = function() {
    network_planning.setAlgorithm($scope.algorithm);
  }

  $scope.route = null;
  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
  });

  $scope.run_algorithm = function() {
    var data = {
      algorithm: $scope.algorithm.id,
    };
    $http.post('/network/nodes/'+$scope.route.id+'/recalc', data).success(function(response) {
      $rootScope.$broadcast('route_planning_changed');
      // network_nodes_layer.reload_data();
      // $rootScope.$broadcast('equipment_nodes_changed');
    });
  };

}]);
