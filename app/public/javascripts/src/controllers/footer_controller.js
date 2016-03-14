/* global app */
// Footer Controller
app.controller('footer_controller', ['$scope', '$rootScope', 'selection', ($scope, $rootScope, selection) => {
  $scope.plan = null
  $scope.selection = selection

  $rootScope.$on('plan_changed_metadata', (e, plan) => {
    $scope.plan = plan
  })

  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
  })
}])
