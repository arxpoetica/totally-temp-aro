class PlanSettingsController {
  constructor(state, $timeout) {
    this.plan = {}
    state.plan.subscribe((newPlan) => this.plan = newPlan)
    this.state = state
    this.userId = state.getUserId()
    this.$timeout = $timeout
  }
}

PlanSettingsController.$inject = ['state', '$timeout']

app.component('planSettings', {
  templateUrl: '/components/sidebar/plan-settings/plan-settings-component.html',
  controller: PlanSettingsController
})