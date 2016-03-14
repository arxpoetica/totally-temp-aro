/* global app config */
app.service('network_planning', ['$rootScope', ($rootScope) => {
  var planning = {}
  var interactive = []
  var algorithms = config.route_planning.map((algorithm) => ({
    id: algorithm.id,
    interactive: interactive.indexOf(algorithm.id) >= 0,
    description: `${algorithm.name}: ${algorithm.description}`
  }))
  var algorithm

  planning.algorithms = () => {
    return algorithms
  }

  planning.findAlgorithm = (algorithm) => {
    return algorithms.find((obj) => algorithm === obj.id)
  }

  planning.getAlgorithm = () => {
    return algorithm
  }

  planning.setAlgorithm = (_algorithm) => {
    if (algorithm === _algorithm) return
    algorithm = _algorithm
    $rootScope.$broadcast('network_planning_algorithm_changed', algorithm)
  }

  return planning
}])
