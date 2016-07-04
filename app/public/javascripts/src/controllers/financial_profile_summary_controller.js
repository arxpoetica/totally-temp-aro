/* global app */
app.controller('financial-profile-summary-controller', ['$scope', '$rootScope', '$http', '$timeout', 'map_tools', ($scope, $rootScope, $http, $timeout, map_tools) => {
  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
  })

  $rootScope.$on('plan_changed_metadata', (e, plan) => {
    $scope.plan = plan
  })

  $scope.hasIRR = () => {
    return $scope.plan && $scope.plan.metadata &&
      +$scope.plan.metadata.irr == $scope.plan.metadata.irr // eslint-disable-line
  }
}])
