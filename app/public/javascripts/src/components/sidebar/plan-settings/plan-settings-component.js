class PlanSettingsController {
  constructor(state) {
    this.plan = {}
    state.plan.subscribe((newPlan) => this.plan = newPlan)
    this.userId = state.getUserId()
  }
}

PlanSettingsController.$inject = ['state']

app.component('planSettings', {
  templateUrl: '/components/sidebar/plan-settings/plan-settings-component.html',
  controller: PlanSettingsController
})