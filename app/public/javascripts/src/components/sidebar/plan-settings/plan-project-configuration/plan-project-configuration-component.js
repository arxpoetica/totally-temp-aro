class PlanProjectConfigurationController {
  constructor($http, state) {
    this.$http = $http
    this.state = state
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })
  }
}

PlanProjectConfigurationController.$inject = ['$http', 'state']

app.component('planProjectConfiguration', {
  templateUrl: '/components/sidebar/plan-settings/plan-project-configuration/plan-project-configuration-component.html',
  bindings: {
    projectId: '<',
    userId: '<',
    planId: '<'
  },
  controller: PlanProjectConfigurationController
})