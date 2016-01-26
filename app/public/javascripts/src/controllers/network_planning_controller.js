// Network Planning Controller
app.controller('network-planning-controller', ['$scope', '$rootScope', 'network_planning', 'map_tools', function($scope, $rootScope, network_planning, map_tools) {
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

}]);
