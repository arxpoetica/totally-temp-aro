/* global app */
// Map Tools Controller
app.controller('map_tools_controller', ['$scope', '$rootScope', 'map_tools', ($scope, $rootScope, map_tools) => {
  $scope.map_tools = map_tools
}])
