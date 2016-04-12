/* global app */
// Search Controller
app.controller('area-network-planning-controller', ['$scope', '$rootScope', '$http', 'map_tools', ($scope, $rootScope, $http, map_tools) => {
  // Controller instance variables
  $scope.map_tools = map_tools

  $scope.allStatus = ['geographies', 'cover', 'budget', 'progress']
  $scope.wizardStatus = $scope.allStatus[0]
  $scope.advancedSettings = false

  $scope.forward = () => {
    var index = $scope.allStatus.indexOf($scope.wizardStatus)
    if (index + 1 < $scope.allStatus.length) {
      $scope.wizardStatus = $scope.allStatus[index + 1]
    }
  }

  $scope.back = () => {
    var index = $scope.allStatus.indexOf($scope.wizardStatus)
    if (index > 0) {
      $scope.wizardStatus = $scope.allStatus[index - 1]
    }
  }

  $scope.toggleAdvancedSettings = () => {
    $scope.advancedSettings = !$scope.advancedSettings
  }
}])
