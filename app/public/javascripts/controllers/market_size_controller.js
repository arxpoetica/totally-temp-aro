// Market Size Controller
app.controller('market_size_controller', ['$scope', '$rootScope', '$http', 'selection', 'MapLayer', function($scope, $rootScope, $http, selection, MapLayer) {
  // Controller instance variables
  $scope.is_visible = false;

  /************
  * FUNCTIONS *
  *************/

  // Listen for visibility toggle to be broadcast through $rootScope from other controller (map_tools_controller)
  $rootScope.$on('toggle_market_size_visibility', function() {

    $scope.is_visible = !$scope.is_visible;
  });


}]);
