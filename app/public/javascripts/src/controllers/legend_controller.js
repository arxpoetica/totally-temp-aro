/* global app _ config */
app.controller('legend-controller', ['$scope', '$http', ($scope, $http) => {
  $scope.expanded = false
  $scope.ARO_CLIENT = config.ARO_CLIENT

  $scope.toggle = () => {
    $scope.expanded = !$scope.expanded
  }

  $scope.view_node_types = []

  $http.get('/network/nodes').success((response) => {
    response.forEach((node_type) => {
      node_type.visible = true
    })
    $scope.view_node_types = _.reject(response, (type) => {
      return config.ui.map_tools.equipment.view.indexOf(type.name) === -1
    })
    $scope.build_node_types = _.reject(response, (type) => {
      return config.ui.map_tools.equipment.build.indexOf(type.name) === -1
    })
  })
}])
