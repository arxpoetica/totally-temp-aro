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
    this.selectedProjectId = null
  }

  $onInit() {
    this.$http.get(`/service/v1/project-template?user_id=${this.userId}`)
      .then((result) => {
        this.allProjects = result.data
        return this.$http.get(`/service/auth/users/${this.userId}/configuration`)
      })
      .then((result) => {
        this.selectedProjectId = result.data.projectTemplateId
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  copySelectedProjectSettingsToPlan() {
    this.state.copyProjectSettingsToPlan(this.selectedProjectId, this.planId, this.userId)
  }

  planSettingsToProject() {
    this.savePlanDataAndResourceSelectionToProject()
    this.state.saveNetworkConfigurationToServer(this.selectedProjectId)
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
    this.$http.put(`/service/v1/project-template/${this.selectedProjectId.id}/configuration?user_id=${this.userId}`, putBody)
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