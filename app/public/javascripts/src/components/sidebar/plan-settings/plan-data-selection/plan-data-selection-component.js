class DataSelectionController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.isDirty = false
    this.dataItems = {}
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })
  }

  $onInit() {
    this.loadFromServer()
  }

  $onDestroy() {
    // If any selections have been changed, ask the user if they want to save them
    if (this.isDirty) {
      swal({
        title: 'Save modified settings?',
        text: 'You have changed the data selection settings. Do you want to save your changes?',
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
    }
  }

  onSelectionChanged() {
    this.isDirty = true
  }

  enableMultiSelects() {
    Object.keys(this.dataItems).forEach((dataItemKey) => {
      setTimeout(() => $(`#${dataItemKey}`).multiselect({
        buttonWidth: '100%'
      }), 0);
    })
  }

  loadFromServer() {

    var promises = [
      this.$http.get('/service/odata/datatypeentity'),
      this.$http.get(`/service/v1/project/${this.projectId}/library?user_id=${this.userId}`),
      this.$http.get(`/service/v1/plan/${this.planId}/configuration?user_id=${this.userId}`)
    ]

    Promise.all(promises)
      .then((results) => {
        // Results will be returned in the same order as the promises array
        var dataTypeEntityResult = results[0].data
        var libraryResult = results[1].data
        var configurationResult = results[2].data

        // Construct the list of elements that we will show
        this.dataItems = {}
        dataTypeEntityResult.forEach((dataTypeEntity) => {
          this.dataItems[dataTypeEntity.name] = {
            description: dataTypeEntity.description,
            selectedLibraryItems: [],
            allLibraryItems: []
          }
        })

        // For each data item, construct the list of all available library items
        Object.keys(this.dataItems).forEach((dataItemKey) => {
          // Add the list of all library items for this data type
          libraryResult.forEach((libraryItem) => {
            if (libraryItem.dataType === dataItemKey) {
              this.dataItems[dataItemKey].allLibraryItems.push(libraryItem)
            }
          })
        })

        // For each data item, construct the list of selected library items
        configurationResult.configurationItems.forEach((configurationItem) => {
          // For this configuration item, find the data item based on the dataType
          var dataItem = this.dataItems[configurationItem.dataType]
          // Find the item from the allLibraryItems based on the library id
          var selectedLibraryItems = configurationItem.libraryItems
          selectedLibraryItems.forEach((selectedLibraryItem) => {
            var matchedLibraryItem = dataItem.allLibraryItems.filter((libraryItem) => libraryItem.identifier === selectedLibraryItem.identifier)
            dataItem.selectedLibraryItems = dataItem.selectedLibraryItems.concat(matchedLibraryItem)  // Technically there will be only one matched item
          })
        })
        setTimeout(() => this.enableMultiSelects(), 2000)
        this.$timeout() // Will safely call $scope.$apply()
      })
  }

  // Saves the plan configuration to the server
  saveToServer() {

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

    // Save the configuration to the server
    this.$http.put(`/service/v1/plan/${this.planId}/configuration?user_id=${this.userId}`, putBody)
  }
}

DataSelectionController.$inject = ['$http', '$timeout', 'state']

// Component did not work when it was called 'dataSelection'
app.component('planDataSelection', {
  templateUrl: '/components/sidebar/plan-settings/plan-data-selection/plan-data-selection-component.html',
  bindings: {
    projectId: '<',
    userId: '<',
    planId: '<'
  },
  controller: DataSelectionController
})