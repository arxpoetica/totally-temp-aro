// Footer Controller
app.controller('footer_controller', ['$scope', '$rootScope', 'selection', function($scope, $rootScope, selection) {

  $scope.route = null;
  $scope.selection = selection;

  $rootScope.$on('route_changed_metadata', function(e, route) {
    $scope.route = route;
  });

  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
  });

}]);
