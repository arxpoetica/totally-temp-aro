class ResourceSelectionController {
  constructor($http, $timeout, state, mockResourceService) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.mockResourceService = mockResourceService
    this.resourceItems = {}
    this.isDirty = false
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })
    this.loadPlanResourceSelectionFromServer()
  }

  $onDestroy() {
    // If any selections have been changed, ask the user if they want to save them
    if (this.isDirty) {
      if (this.areAllSelectionsValid()) {
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
            this.saveToServer()
          }
          this.isDirty = false  // Technically not required since we are in $onDestroy
        })
      } else {
        // All selections are not valid
        swal({
          title: 'Invalid selections',
          text: 'The resource selections are not valid. Correct them before trying to save your changes.',
          type: 'error',
          showCancelButton: false,
          confirmButtonColor: '#DD6B55'
        })
      }
    }
  }

  loadPlanResourceSelectionFromServer() {

    this.resourceItems = {}
    var resourceItemOrder = {}  // The order of promises
    this.mockResourceService.get('/service/odata/resourcetypeentity')
      .then((result) => {
        if (result.status >= 200 && result.status <= 299) {
          // Save all our resource items
          var allManagerPromises = []
          result.data.forEach((resourceItem) => {
            this.resourceItems[resourceItem.name] = {
              id: resourceItem.id,
              key: resourceItem.name,
              description: resourceItem.description,
              allManagers: [],
              selectedManager: null,
              showResourceEditorModal: (resourceKey) => {
                // Doing it this way because this.resourceItems goes into a ng-repeat, and calling the function this way is easier.
                this.state.resourceItemForEditorModal = this.resourceItems[resourceKey]
                this.state.showResourceEditorModal = true
              }
            }
            var endpointId = resourceItem.name.replace('_', '-')  // e.g. 'arpu_manager' becomes 'arpu-manager'
            allManagerPromises.push(this.mockResourceService.get(`/service/v1/${endpointId}`))
            // Save the resource item name corresponding to the index of this promise, as we will do a Promise.all() later
            resourceItemOrder[Object.keys(resourceItemOrder).length] = resourceItem.name
          })
          return Promise.all(allManagerPromises)
        } else {
          return Promise.reject(result)
        }
      })
      .then((allManagers) => {
        // Save the list of "all managers" in our object
        for (var iManager = 0; iManager < allManagers.length; ++iManager) {
          var resourceName = resourceItemOrder[iManager]
          this.resourceItems[resourceName].allManagers = allManagers[iManager].data || []
        }
        // Now get the project configuration that will contain a list of the selected managers
        return this.$http.get(`/service/v1/plan/${this.planId}/configuration?user_id=${this.userId}`)
      })
      .then((planConfiguration) =>{
        // Add the "selected" managers to our resourceItem object
        planConfiguration.data.resourceConfigItems.forEach((resourceConfigItem) => {
          var resourceName = resourceConfigItem.aroResourceType
          if (this.resourceItems[resourceName]) { // This condition is only because the names in aro-service are currently mismatched
            var matchingResources = this.resourceItems[resourceName].allManagers.filter((item) => item.id === resourceConfigItem.resourceManagerId)
            if (matchingResources.length === 1) {
              this.resourceItems[resourceName].selectedManager = matchingResources[0]
            }
          }
        })
        console.log(this.resourceItems)
      })
      .catch((err) => console.log(err))
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