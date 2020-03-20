class PlanProjectConfigurationController {
  constructor ($http, $timeout, $ngRedux, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state

    this.allProjects = []
    this.selectedProjectId = null
    this.showProjectCreation = false
    this.newProjectName = 'New Project'
    this.parentProjectForNewProject = null

    this.modes = Object.freeze({
      HOME: 'HOME',
      MANAGE_PROJECTS: 'MANAGE_PROJECTS',
      CREATE_PROJECT: 'CREATE_PROJECT',
      COPY_PROJECT_TO_PLAN: 'COPY_PROJECT_TO_PLAN',
      COPY_PLAN_TO_PROJECT: 'COPY_PLAN_TO_PROJECT'
    })
    this.selectedMode = this.modes.HOME
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  $onInit () {
    this.reloadProjects()
  }

  setSelectedMode(mode) {
    this.selectedMode = mode
    this.$timeout()
  }

  reloadProjects() {
    const filter = `deleted eq false and userId eq ${this.userId}`
    const RESOUSRCE_READ = 4
    this.$http.get(`/service/odata/userprojectentity?$select=id,name,permissions&$filter=${filter}&$orderby=name&$top=10000`)
      .then((result) => {
        let myProjects = []

        // loop through the project and find check the permission bits to see
        // if the current user has READ and ADMIN privilage to manage the resource
        for(let i = 0; i < result.data.length; i++) {
          const permissions = result.data[i].permissions
          const hasView = Boolean(permissions & RESOUSRCE_READ)
          if(hasView) {
            const hasWrite = Boolean(permissions & this.authPermissions.RESOURCE_WRITE.permissionBits)
            const hasAdmin = Boolean(permissions & this.authPermissions.RESOURCE_ADMIN.permissionBits)
            const hasResourceWorkflow = Boolean(permissions & this.authPermissions.RESOURCE_WORKFLOW.permissionBits)
            result.data[i].hasAdminPermission = hasWrite || hasAdmin || hasResourceWorkflow
            myProjects.push(result.data[i])
          }
        }
          
        this.allProjects = myProjects
        this.parentProjectForNewProject = this.allProjects[0]
        return this.$http.get(`/service/auth/users/${this.userId}/configuration`)
      })
      .then((result) => {
        this.selectedProjectId = result.data.projectTemplateId
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  planSettingsToProject () {
    // Making these calls in parallel causes a crash in aro-service. Call sequentially.
    this.savePlanDataAndResourceSelectionToProject()
      .then(() => {
        // this.state.saveNetworkConfigurationToDefaultProject()
        this.setSelectedMode(this.modes.HOME)
      })
      .catch((err) => console.error(err))
  }

  createProject (projectName, parentProject) {
    this.$http.post(`/service/v1/project-template`, { name: projectName, parentId: parentProject.id })
      .then(result => {
        this.reloadProjects()
        this.setSelectedMode(this.modes.HOME)
        this.$timeout()
      })
      .catch(err => console.error(err))
  }

  cancelProjectCreation () {
    this.newProjectName = 'New Project'
    this.setSelectedMode(this.modes.HOME)
  }

  deleteProject (project) {
    project.isDeleting = true
    this.$http.delete(`/service/v1/project-template/${project.id}`)
      .then(result => {
        project.isDeleting = false
        this.reloadProjects()
        this.setSelectedMode(this.modes.HOME)
      })
      .catch(err => {
        project.isDeleting = false
        this.$timeout()
        console.error(err)
      })
  }

  editProjectSettings(srcId) {
    this.state.showProjectSettingsModal.next(true)

    //this.state.showDataSourceUploadModal.next(true)

    // this.state.uploadDataSources.forEach((value) => {
    //   if (value.id == srcId) {
    //     this.state.uploadDataSource = value
    //   }
    // })
  }


  // Saves the plan Data Selection and Resource Selection to the project
  savePlanDataAndResourceSelectionToProject () {
    var putBody = {
      configurationItems: [],
      resourceConfigItems: []
    }

    Object.keys(this.dataItems).forEach((dataItemKey) => {
      // An example of dataItemKey is 'location'
      if (this.dataItems[dataItemKey].selectedLibraryItems.length > 0) {
        var configurationItem = {
          dataType: dataItemKey,
          libraryItems: this.dataItems[dataItemKey].selectedLibraryItems
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
    return this.$http.put(`/service/v1/project-template/${this.selectedProjectId}/configuration`, putBody)
  }

  mapStateToThis (reduxState) {
    return {
      authPermissions: reduxState.user.authPermissions,
      dataItems: reduxState.plan.dataItems
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }
}

PlanProjectConfigurationController.$inject = ['$http', '$timeout', '$ngRedux', 'state']

let planProjectConfiguration = {
  templateUrl: '/components/sidebar/plan-settings/plan-project-configuration/plan-project-configuration.html',
  bindings: {
    userId: '<',
    planId: '<'
  },
  controller: PlanProjectConfigurationController
}

export default planProjectConfiguration
