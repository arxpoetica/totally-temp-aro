class ResourceSelectionController {
  constructor($http, $timeout, state, mockResourceService) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.mockResourceService = mockResourceService
    this.resourceItems = {}
    this.pristineResourceItems = {}
    this.isDirty = false
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })
  }

  $onInit() {
    this.loadPlanResourceSelectionFromServer()
  }

  $onDestroy() {
    // If any selections have been changed, ask the user if they want to save them
    if (!angular.equals(this.resourceItems, this.pristineResourceItems)) {
      swal({
        title: 'Save modified settings?',
        text: 'You have changed the resource selection settings. Do you want to save your changes?',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes',
        showCancelButton: true,
        cancelButtonText: 'No',
        closeOnConfirm: true
      }, (result) => {
        if (result) {
          // Save the changed settings to aro-service
          this.savePlanResourceSelectionToServer()
        }
        this.isDirty = false  // Technically not required since we are in $onDestroy
      })
    }
  }

  // Load the plan resource selections from the server
  loadPlanResourceSelectionFromServer() {

    this.resourceItems = {}
    Promise.all([
      this.$http.get('/service/odata/resourcetypeentity'), // The types of resource managers
      this.$http.get('/service/odata/resourcemanager?$select=name,id,description,managerType'), // All resource managers in the system
      this.$http.get(`/service/v1/plan/${this.planId}/configuration?user_id=${this.userId}`)
    ])
    .then((results) => {
      var resourceManagerTypes = results[0].data
      var allResourceManagers = results[1].data
      var selectedResourceManagers = results[2].data.resourceConfigItems

      // First set up the resource items so that we display all types in the UI
      resourceManagerTypes.forEach((resourceManager) => {
        this.resourceItems[resourceManager.name] = {
          id: resourceManager.id,
          description: resourceManager.description,
          allManagers: [],
          selectedManager: null,
          showResourceEditorModal: (resourceKey) => {
            // Doing it this way because this.resourceItems goes into a ng-repeat, and calling the function this way is easier.
            this.state.resourceItemForEditorModal = this.resourceItems[resourceKey]
            this.state.showResourceEditorModal = true
          }
        }
      })

      // Then add all the managers in the system to the appropriate type
      allResourceManagers.forEach((resourceManager) => {
        this.resourceItems[resourceManager.managerType].allManagers.push(resourceManager)
      })

      // Then select the appropriate manager for each type
      selectedResourceManagers.forEach((selectedResourceManager) => {
        var allManagers = this.resourceItems[selectedResourceManager.aroResourceType].allManagers
        var matchedManagers = allManagers.filter((item) => item.id === selectedResourceManager.resourceManagerId)
        if (matchedManagers.length === 1) {
          this.resourceItems[selectedResourceManager.aroResourceType].selectedManager = matchedManagers[0]
        }
      })

      // Save a deep copy of the pristine state, so we can check if it has changed
      this.pristineResourceItems = angular.copy(this.resourceItems)
    })
  }

  // Save the plan resource selections to the server
  savePlanResourceSelectionToServer() {
    var putBody = {
      configurationItems: [],
      resourceConfigItems: []
    }

    Object.keys(this.resourceItems).forEach((resourceItemKey) => {
      var selectedManager = this.resourceItems[resourceItemKey].selectedManager
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

    // Save the configuration to the server
    this.$http.put(`/service/v1/plan/${this.planId}/configuration?user_id=${this.userId}`, putBody)
      .then((result) => {
        // Save a deep copy of the pristine state, so we can check if it has changed
        this.pristineResourceItems = angular.copy(this.resourceItems)
      })
  }
}

ResourceSelectionController.$inject = ['$http', '$timeout', 'state', 'mockResourceService']

// Component did not work when it was called 'dataSelection'
app.component('planResourceSelection', {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/plan-resource-selection-component.html',
  bindings: {
    projectId: '<',
    userId: '<',
    planId: '<'
  },
  controller: ResourceSelectionController
})