/* global app */
// Map Tools Controller
app.controller('map_tools_controller', ['$scope', 'map_tools', 'state', ($scope, map_tools, state) => {
  $scope.map_tools = map_tools
  $scope.state = state
}])
