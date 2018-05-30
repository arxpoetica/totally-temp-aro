class PlanProjectConfigurationController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })
    this.allProjects = []
    this.selectedProject = null
  }

  $onInit() {
    this.$http.get(`/service/v1/project-template?user_id=${this.userId}`)
      .then((result) => {
        this.allProjects = result.data
        this.selectedProject = (this.allProjects.length > 0) ? this.allProjects[0] : null
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  projectSettingsToPlan() {
    this.$http.get(`/service/v1/project-template/${this.selectedProject.id}/configuration?user_id=${this.userId}`)
      .then((response)=> {
        return this.$http.put(`/service/v1/plan/${this.planId}/configuration?user_id=${this.userId}`, response.data)
      })
      .then((response)=> this.state.loadPlanInputs(this.planId))
      .then(()=> this.state.loadNetworkConfigurationFromServer(this.selectedProject.id))
      .then(() => this.state.recreateTilesAndCache())
      .catch((err) => console.error(err))
  }

  planSettingsToProject() {
    this.savePlanDataAndResourceSelectionToProject()
    this.state.saveNetworkConfigurationToServer(this.selectedProject.id)
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
    this.$http.put(`/service/v1/project-template/${this.selectedProject.id}/configuration?user_id=${this.userId}`, putBody)
  }    
}

PlanProjectConfigurationController.$inject = ['$http', '$timeout', 'state']

let planProjectConfiguration = {
  templateUrl: '/components/sidebar/plan-settings/plan-project-configuration/plan-project-configuration.html',
  bindings: {
    userId: '<',
    planId: '<'
  },
  controller: PlanProjectConfigurationController
}

export default planProjectConfiguration