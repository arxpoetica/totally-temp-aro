// Footer Controller
app.controller('footer_controller', ['$scope', '$rootScope', 'selection', function($scope, $rootScope, selection) {

  $scope.plan = null;
  $scope.selection = selection;

  $rootScope.$on('plan_changed_metadata', function(e, plan) {
    $scope.plan = plan;
  });

  $rootScope.$on('plan_selected', (e, plan) => $scope.plan = plan);

}]);
