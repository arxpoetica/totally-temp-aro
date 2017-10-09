class DataSelectionController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.isDirty = false
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })
  }

  $onInit() {
    this.updateSelectionValidation()
  }

  $onDestroy() {
    // If any selections have been changed, ask the user if they want to save them
    if (this.isDirty) {
      if (this.areAllSelectionsValid()) {
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
      } else {
        // All selections are not valid
        swal({
          title: 'Invalid selections',
          text: 'The data selections are not valid. Correct them before trying to save your changes.',
          type: 'error',
          showCancelButton: false,
          confirmButtonColor: '#DD6B55'
        })
      }
    }
  }

  onSelectionChanged() {
    this.isDirty = true
    this.updateSelectionValidation()
  }

  // Updates the 'valid' flags for all data items
  updateSelectionValidation() {
    Object.keys(this.allDataItems).forEach((dataItemKey) => {
      var dataItem = this.allDataItems[dataItemKey]
      dataItem.isMinValueSelectionValid = dataItem.selectedLibraryItems.length >= dataItem.minValueInc
      dataItem.isMaxValueSelectionValid = dataItem.selectedLibraryItems.length < dataItem.maxValueExc
    })
    this.$timeout() // Will safely call $scope.$apply()
  }

  areAllSelectionsValid() {
    var areAllSelectionsValid = true
    Object.keys(this.allDataItems).forEach((dataItemKey) => {
      var dataItem = this.allDataItems[dataItemKey]
      if (!dataItem.isMinValueSelectionValid || !dataItem.isMaxValueSelectionValid) {
        areAllSelectionsValid = false
      }
    })
    return areAllSelectionsValid
  }

  uploadDataSource(srcId) {
    this.state.showDataSourceUploadModal.next(true)

    this.state.uploadDataSources.forEach((value) => {
      if (value.id == srcId) {
        this.state.uploadDataSource = value
      }
    });
  }

  // Saves the plan configuration to the server
  saveToServer() {

    var putBody = {
      configurationItems: [],
      resourceConfigItems: []
    }

    Object.keys(this.allDataItems).forEach((dataItemKey) => {
      // An example of dataItemKey is 'location'
      if (this.allDataItems[dataItemKey].selectedLibraryItems.length > 0) {
        var configurationItem = {
          dataType: dataItemKey,
          libraryItems: this.allDataItems[dataItemKey].selectedLibraryItems
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
    planId: '<',
    allDataItems: '='
  },
  controller: DataSelectionController
})