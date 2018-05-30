class PlanSettingsController {
  constructor($scope, state, $timeout, configuration) {
    this.plan = {}
    state.plan.subscribe((newPlan) => this.plan = newPlan)
    this.state = state
    this.userId = state.getUserId()
    this.currentUser = state.getUser()
    this.$timeout = $timeout
    $scope.configuration = configuration

  }
}

PlanSettingsController.$inject = ['$scope', 'state', '$timeout', 'configuration']

let planSettings = {
  templateUrl: '/components/sidebar/plan-settings/plan-settings.html',
  controller: PlanSettingsController
}

export default planSettings