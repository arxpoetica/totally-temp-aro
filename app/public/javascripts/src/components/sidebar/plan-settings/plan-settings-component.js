class PlanSettingsController {
  constructor(state, $timeout) {
    this.plan = {}
    state.plan.subscribe((newPlan) => this.plan = newPlan)
    this.state = state
    this.isdataItems = false
    this.userId = state.getUserId()
    this.$timeout = $timeout

    this.state.loadPlanDataSelectionFromServer().then((dataItems) => {
      this.allDataItems = dataItems
      this.isdataItems = true
      this.$timeout() // Will safely call $scope.$apply()
    })

  }
}

PlanSettingsController.$inject = ['state', '$timeout']

app.component('planSettings', {
  templateUrl: '/components/sidebar/plan-settings/plan-settings-component.html',
  controller: PlanSettingsController
})