/* global app */
app.controller('demand-forecast-controller', ['$scope', '$rootScope', '$http', 'map_tools', ($scope, $rootScope, $http, map_tools) => {
  $scope.map_tools = map_tools
  $scope.growth = 0
  $scope.duration = 5
}])