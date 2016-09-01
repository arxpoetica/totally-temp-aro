/* global app _ config */
app.controller('legend-controller', ['$scope', '$http', ($scope, $http) => {
  $scope.expanded = false
  $scope.ARO_CLIENT = config.ARO_CLIENT

  $scope.toggle = () => {
    $scope.expanded = !$scope.expanded
  }

  $scope.view_node_types = []
}])
