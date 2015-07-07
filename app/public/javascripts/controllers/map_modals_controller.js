// Map Modals Controller
app.controller('map_modals_controller', ['$scope', '$rootScope', function($scope, $rootScope) {
  $scope.source_id = 'None';
  $scope.target_id = 'None';
  $scope.is_visible = false;
  $rootScope.$on('toggle_tool_visibility', function() {
    $scope.is_visible = !$scope.is_visible;
  });
}]);