
class DataSelectionController {
  constructor($http, $timeout, $rootScope, state, aclManager) {
    this.$http = $http
    this.$timeout = $timeout
    this.$rootScope = $rootScope
    this.state = state
    this.aclManager = aclManager
    this.currentUser = state.loggedInUser
    this.sales_role_remove = ['cable_construction_area', 'construction_location', 'edge', 'construction_location', 'tile_system', 'construction_area']
    
    this.isDataSourceEditable = {}
  }

  $onInit() {
    this.updateSelectionValidation()
    Object.keys(this.allDataItems).forEach(dataSourceKey => {
      this.isDataSourceEditable[dataSourceKey] = false
      this.updateDataSourceEditableStatus(dataSourceKey)
    })
    
    var isValid = this.areAllSelectionsValid()
    this.onChange({childKey:this.key, isValid:isValid, isInit: true})
  }

  $doCheck() {
    if (this.allDataItems != this.cachedDataItems) {
      this.updateSelectionValidation()
      this.cachedDataItems = this.allDataItems
    }
  }
  
  
  onSelectionChanged(dataSource) {
    this.state.dataItemsChanged.next(this.state.dataItems)
    this.updateSelectionValidation()
    this.updateDataSourceEditableStatus(dataSource)
    
    var isValid = this.areAllSelectionsValid()
    this.onChange({childKey:this.key, isValid:isValid})
  }

  updateDataSourceEditableStatus(dataSourceKey) {
    this.isDataSourceEditable[dataSourceKey] = (dataSourceKey === 'location' || dataSourceKey === 'service_layer')
                                                && (this.allDataItems[dataSourceKey].selectedLibraryItems.length === 1)
    if (this.isDataSourceEditable[dataSourceKey]) {
      // We still think this is editable, now check for ACL by making a call to service
      this.aclManager.getEffectivePermissions('LIBRARY', this.allDataItems[dataSourceKey].selectedLibraryItems[0].identifier, this.state.loggedInUser)
        .then(permissions => {
          this.isDataSourceEditable[dataSourceKey] = permissions && (permissions[this.aclManager.PERMISSIONS.WRITE]
                                                                    || permissions[this.aclManager.PERMISSIONS.ADMIN]
                                                                    || permissions[this.aclManager.PERMISSIONS.IS_SUPERUSER])
          this.$timeout()
        })
        .catch(err => console.error(err))
      }
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

DataSelectionController.$inject = ['$http', '$timeout', '$rootScope', 'state', 'aclManager']

// Component did not work when it was called 'dataSelection'
let planDataSelection = {
  templateUrl: '/components/sidebar/plan-settings/plan-data-selection/plan-data-selection.html',
  bindings: {
    userId: '<',
    planId: '<',
    key: '<', 
    onChange: '&', 
    allDataItems: '='
  },
  controller: DataSelectionController
}

export default planDataSelection