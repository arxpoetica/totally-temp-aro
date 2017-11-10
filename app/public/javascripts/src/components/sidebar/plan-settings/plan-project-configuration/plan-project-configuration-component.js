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

  planToProjectDefaults() {
    this.loadProjectDataAndResourceSelection()
    .then((response)=> {
      this.SaveToPlanDataAndResourceSelection(response.data)
    })
  }

  commitToProject() {
    this.state.saveDataSelectionToServer().then(() => {
      this.state.savePlanResourceSelectionToServer()
    })
  }

  loadProjectDataAndResourceSelection() {
    return this.$http.get(`/service/v1/project/${this.projectId}/configuration?user_id=${this.userId}`)
  }

  SaveToPlanDataAndResourceSelection(configuration) {
    this.$http.put(`/service/v1/plan/${this.planId}/configuration?user_id=${this.userId}`, configuration)
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