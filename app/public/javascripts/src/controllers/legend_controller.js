/* global app config */
app.controller('legend-controller', ['$scope', '$rootScope', '$http', 'configuration', ($scope, $rootScope, $http, configuration) => {
  $scope.expanded = false
  $scope.ARO_CLIENT = config.ARO_CLIENT

  $scope.toggle = () => {
    $scope.expanded = !$scope.expanded
  }

  $scope.view_node_types = []

  $scope.isLoadingConfiguration = true
  $rootScope.$on('configuration_loaded', () => {
    $scope.locationCategories = configuration.locationCategories
    $scope.isLoadingConfiguration = false
  })

}])
