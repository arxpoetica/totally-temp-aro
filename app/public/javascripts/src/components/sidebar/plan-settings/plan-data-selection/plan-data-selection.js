class DataSelectionController {
  constructor($http, $timeout, $rootScope, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.$rootScope = $rootScope
    this.state = state
    this.isDirty = false
    this.currentUser = state.loggedInUser
    this.sales_role_remove = ['cable_construction_area', 'construction_location', 'edge', 'construction_location', 'tile_system', 'construction_area']
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })

    state.planOptimization.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })
  }

  $onInit() {
    this.updateSelectionValidation()
  }

  $doCheck() {
    if (this.allDataItems != this.cachedDataItems) {
      this.updateSelectionValidation()
      this.cachedDataItems = this.allDataItems
    }
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
            this.state.saveDataSelectionToServer()
            //Clear the selected Service area when modify the optimization
            this.clearAllSelectedSA()
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

  clearAllSelectedSA() {
    var plan = this.state.plan.getValue()

    this.$http.delete(`/service_areas/${plan.id}/removeAllServiceAreaTargets`, { })
    .then(() => {
      this.state.reloadSelectedServiceAreas()
      return Promise.resolve()
    })
  }

  onSelectionChanged() {
    this.isDirty = true
    this.state.dataItemsChanged.next(this.state.dataItems)
    this.updateSelectionValidation()
  }

  // Updates the 'valid' flags for all data items
  updateSelectionValidation() {
    Object.keys(this.allDataItems).forEach((dataItemKey) => {
      if(this.currentUser.perspective === 'sales' && this.sales_role_remove.indexOf(dataItemKey) !== -1) {
        this.allDataItems[dataItemKey].hidden = true
      }

      var dataItem = this.allDataItems[dataItemKey]
      dataItem.isMinValueSelectionValid = dataItem.selectedLibraryItems.length >= dataItem.minValue
      dataItem.isMaxValueSelectionValid = dataItem.selectedLibraryItems.length <= dataItem.maxValue
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

  editDataSource(itemKey) {
    itemKey === 'location' && this.editLocations()
    itemKey === 'service_layer' && this.editServiceLayer()
  }

  editLocations() {
    // Put the application in "Edit Location" mode
    this.state.selectedDisplayMode.next(this.state.displayModes.VIEW)
    this.state.activeViewModePanel = this.state.viewModePanels.EDIT_LOCATIONS
  }

  editServiceLayer() {
    // Put the application in "Edit Service Layer" mode
    this.state.selectedDisplayMode.next(this.state.displayModes.VIEW)
    this.state.activeViewModePanel = this.state.viewModePanels.EDIT_SERVICE_LAYER
  }
}

DataSelectionController.$inject = ['$http', '$timeout', '$rootScope', 'state']

// Component did not work when it was called 'dataSelection'
let planDataSelection = {
  templateUrl: '/components/sidebar/plan-settings/plan-data-selection/plan-data-selection.html',
  bindings: {
    userId: '<',
    planId: '<',
    allDataItems: '='
  },
  controller: DataSelectionController
}

export default planDataSelection