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
      return this.SaveToPlanDataAndResourceSelection(response.data)
    })
    .then((response)=> {
      this.state.loadPlanDataSelectionFromServer()
      this.state.loadPlanResourceSelectionFromServer()
    })   
  }

  commitToProject() {
    this.savePlanDataAndResourceSelectionToProject()
    this.state.saveNetworkConfigurationToServer()
  }

  // Saves the plan Data Selection and Resource Selection to the project
  savePlanDataAndResourceSelectionToProject() {
    var putBody = {
      configurationItems: [],
      resourceConfigItems: []
    }

    Object.keys(this.state.dataItems).forEach((dataItemKey) => {
      // An example of dataItemKey is 'location'
      if (this.state.dataItems[dataItemKey].selectedLibraryItems.length > 0) {
        var configurationItem = {
          dataType: dataItemKey,
          libraryItems: this.state.dataItems[dataItemKey].selectedLibraryItems
        }
        putBody.configurationItems.push(configurationItem)
      }
    })

    Object.keys(this.state.resourceItems).forEach((resourceItemKey) => {
      var selectedManager = this.state.resourceItems[resourceItemKey].selectedManager
      if (selectedManager) {
        // We have a selected manager
        putBody.resourceConfigItems.push({
          aroResourceType: resourceItemKey,
          resourceManagerId: selectedManager.id,
          name: selectedManager.name,
          description: selectedManager.description
        })
      }
    })

    // Save the configuration to the project
    this.$http.put(`/service/v1/project/${this.projectId}/configuration?user_id=${this.userId}`, putBody)
  }    

  loadProjectDataAndResourceSelection() {
    return this.$http.get(`/service/v1/project/${this.projectId}/configuration?user_id=${this.userId}`)
  }

  SaveToPlanDataAndResourceSelection(configuration) {
    return this.$http.put(`/service/v1/plan/${this.planId}/configuration?user_id=${this.userId}`, configuration)
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