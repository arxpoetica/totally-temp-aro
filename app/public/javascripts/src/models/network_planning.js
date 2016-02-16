app.service('network_planning', ['$rootScope', function($rootScope) {

  var planning = {};
  var descriptions = {
    'fttp': 'FTTP',
    'shortest_path': 'Shortest path',
  };
  var interactive = ['shortest_path'];
  var algorithms = config.route_planning.map((id) => ({
    id: id,
    interactive: interactive.indexOf(id) >= 0,
    description: descriptions[id],
  }));
  var algorithm;

  planning.algorithms = function() {
    return algorithms;
  }

  planning.findAlgorithm = function(algorithm) {
    return algorithms.find((obj) => algorithm === obj.id);
  }

  planning.getAlgorithm = function() {
    return algorithm;
  };

  planning.setAlgorithm = function (_algorithm) {
    if (algorithm === _algorithm) return
    algorithm = _algorithm;
    $rootScope.$broadcast('network_planning_algorithm_changed', algorithm);
  }

  return planning;

}]);
