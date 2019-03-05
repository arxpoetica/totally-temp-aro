
class PlanProjectConfigurationController {
  constructor ($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state

    this.allProjects = []
    this.selectedProjectId = null
    this.showProjectCreation = false
    this.newProjectName = 'New Project'
    this.parentProjectForNewProject = null
  }

  $onInit () {
    this.reloadProjects()
  }

  reloadProjects() {
    this.$http.get(`/service/v1/project-template?user_id=${this.userId}`)
      .then((result) => {
        this.allProjects = result.data
        this.parentProjectForNewProject = this.allProjects[0]
        return this.$http.get(`/service/auth/users/${this.userId}/configuration`)
      })
      .then((result) => {
        this.selectedProjectId = result.data.projectTemplateId
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  copySelectedProjectSettingsToPlan () {
    this.state.copyProjectSettingsToPlan(this.selectedProjectId, this.planId, this.userId)
  }

  planSettingsToProject () {
    // Making these calls in parallel causes a crash in aro-service. Call sequentially.
    this.savePlanDataAndResourceSelectionToProject()
      .then(() => this.state.saveNetworkConfigurationToDefaultProject())
      .catch((err) => console.error(err))
  }

  createProject (projectName, parentProject) {
    this.$http.post(`/service/v1/project-template?user_id=${this.userId}`, { name: projectName, parentId: parentProject.id })
      .then(result => {
        this.reloadProjects()
        this.$timeout()
      })
      .catch(err => console.error(err))
  }

  cancelProjectCreation () {
    this.newProjectName = 'New Project'
    this.showProjectCreation = false
    this.$timeout()
  }

  deleteProject (project) {
    project.isDeleting = true
    this.$http.delete(`/service/v1/project-template/${project.id}?user_id=${this.userId}`)
      .then(result => {
        project.isDeleting = false
        this.reloadProjects()
      })
      .catch(err => {
        project.isDeleting = false
        this.$timeout()
        console.error(err)
      })
  }

  // Saves the plan Data Selection and Resource Selection to the project
  savePlanDataAndResourceSelectionToProject () {
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
    return this.$http.put(`/service/v1/project-template/${this.selectedProjectId}/configuration?user_id=${this.userId}`, putBody)
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
