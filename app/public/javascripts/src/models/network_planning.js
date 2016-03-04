/* global app config */
app.service('network_planning', ['$rootScope', ($rootScope) => {
  var planning = {}
  var descriptions = {
    'fttp': 'FTTP',
    'shortest_path': 'Shortest path'
  }
  var interactive = ['shortest_path']
  var algorithms = config.route_planning.map((id) => ({
    id: id,
    interactive: interactive.indexOf(id) >= 0,
    description: descriptions[id]
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
