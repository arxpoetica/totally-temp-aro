// Map Tools Controller
app.controller('map_tools_controller', ['$scope', '$rootScope', function($scope, $rootScope) {
  $scope.toggle_tool_visibility = function() {
    $rootScope.$broadcast('toggle_tool_visibility');
  }
  
  $scope.toggle_market_size_visibility = function() {
    $rootScope.$broadcast('toggle_market_size_visibility');
  }

}]);