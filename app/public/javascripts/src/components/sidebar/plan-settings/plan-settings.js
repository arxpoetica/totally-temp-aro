class PlanSettingsController {
  constructor(state, $timeout) {
    this.plan = {}
    state.plan.subscribe((newPlan) => this.plan = newPlan)
    this.state = state
    this.currentUser = state.loggedInUser
    this.$timeout = $timeout
  }
}

PlanSettingsController.$inject = ['state', '$timeout']

let planSettings = {
  templateUrl: '/components/sidebar/plan-settings/plan-settings.html',
  controller: PlanSettingsController
}

export default planSettings