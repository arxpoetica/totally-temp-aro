/* global app */
// Map Tools Controller
app.controller('map_tools_controller', ['$scope', '$rootScope', 'map_tools', 'state', 'configuration', ($scope, $rootScope, map_tools, state, configuration) => {
  $scope.map_tools = map_tools
  $scope.currentUser = state.getUser()
  $scope.configuration = configuration
}])
