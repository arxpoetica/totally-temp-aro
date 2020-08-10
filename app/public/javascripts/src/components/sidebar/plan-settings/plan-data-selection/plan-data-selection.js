/* globals angular */
import PlanActions from '../../../../react/components/plan/plan-actions'
import { createSelector } from 'reselect'

// Make a copy of data items because the UI component will mutate them directly
const getDataItems = reduxState => reduxState.plan.dataItems
const getDataItemsCopy = createSelector([getDataItems], dataItems => angular.copy(dataItems))

class DataSelectionController {
  constructor ($http, $timeout, $rootScope, $ngRedux, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.$rootScope = $rootScope
    this.state = state
    this.currentUser = state.loggedInUser
    this.sales_role_remove = ['cable_construction_area', 'construction_location', 'edge', 'construction_location', 'tile_system', 'construction_area']

    this.isDataSourceEditable = {}
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)

    
  }

  $onInit () {
    this.updateSelectionValidation()
    Object.keys(this.dataItems).forEach(dataSourceKey => {
      this.isDataSourceEditable[dataSourceKey] = false
      this.updateDataSourceEditableStatus(dataSourceKey)
    })

    var isValid = this.areAllSelectionsValid()
    this.onChange({ childKey: this.key, isValid: isValid, isInit: true })
  }

  $doCheck () {
    if (this.dataItems != this.cachedDataItems) {
      this.updateSelectionValidation()
      this.cachedDataItems = this.dataItems
    }
  }

  onSelectionChanged (dataSource) {
    this.selectDataItems(dataSource, this.dataItems[dataSource].selectedLibraryItems.map(item => JSON.parse(angular.toJson(item))))
    this.updateSelectionValidation()
    this.updateDataSourceEditableStatus(dataSource)

    var isValid = this.areAllSelectionsValid()
    this.onChange({ childKey: this.key, isValid: isValid })
  }

  updateDataSourceEditableStatus (dataSourceKey) {
    this.isDataSourceEditable[dataSourceKey] = (dataSourceKey === 'location' || dataSourceKey === 'service_layer') &&
                                                (this.dataItems[dataSourceKey].selectedLibraryItems.length === 1)
    if (this.isDataSourceEditable[dataSourceKey]) {
      // We still think this is editable, now check for ACL by making a call to service
      const libraryId = this.dataItems[dataSourceKey].selectedLibraryItems[0].identifier  // Guaranteed to have 1 selection at this point
      const dataSourceFilterString = `metaDataId eq ${libraryId}`
      const filterString = `${dataSourceFilterString} and userId eq ${this.state.loggedInUser.id}`
      this.$http.get(`/service/odata/UserLibraryViewEntity?$select=dataSourceId,permissions&$filter=${filterString}&$top=1000`)
        .then(result => {
          const permissions = (result.data.length === 1) ? result.data[0].permissions : 0
          const hasWrite = Boolean(permissions & this.authPermissions.RESOURCE_WRITE.permissionBits)
          const hasAdmin = Boolean(permissions & this.authPermissions.RESOURCE_ADMIN.permissionBits)
          const hasResourceWorkflow = Boolean(permissions & this.authPermissions.RESOURCE_WORKFLOW.permissionBits)
          this.isDataSourceEditable[dataSourceKey] = hasWrite || hasAdmin || hasResourceWorkflow
          this.$timeout()
        })
        .catch(err => console.error(err))
    }
  }

  // Updates the 'valid' flags for all data items
  updateSelectionValidation () {
    Object.keys(this.dataItems).forEach((dataItemKey) => {
      if (this.currentUser.perspective === 'sales' && this.sales_role_remove.indexOf(dataItemKey) !== -1) {
        this.dataItems[dataItemKey].hidden = true
      }

      var dataItem = this.dataItems[dataItemKey]
      dataItem.isMinValueSelectionValid = dataItem.selectedLibraryItems.length >= dataItem.minValue
      dataItem.isMaxValueSelectionValid = dataItem.selectedLibraryItems.length <= dataItem.maxValue
    })
    this.$timeout() // Will safely call $scope.$apply()
  }

  areAllSelectionsValid () {
    var areAllSelectionsValid = true
    Object.keys(this.dataItems).forEach((dataItemKey) => {
      var dataItem = this.dataItems[dataItemKey]
      if (!dataItem.isMinValueSelectionValid || !dataItem.isMaxValueSelectionValid) {
        areAllSelectionsValid = false
      }
    })
    return areAllSelectionsValid
  }

  uploadDataSource (srcId) {

    this.state.selectedDataTypeId = srcId
    this.state.showDataSourceUploadModal.next(true)
    
    this.state.uploadDataSources.forEach((value) => {
      if (value.id == srcId) {
        this.state.uploadDataSource = value
      }
    })
  }

  editDataSource (itemKey) {
    itemKey === 'location' && this.editLocations()
    itemKey === 'service_layer' && this.editServiceLayer()
  }

  editLocations () {
    // Put the application in "Edit Location" mode
    this.state.selectedDisplayMode.next(this.state.displayModes.VIEW)
    this.state.activeViewModePanel = this.state.viewModePanels.EDIT_LOCATIONS
  }

  editServiceLayer () {
    // Put the application in "Edit Service Layer" mode
    this.state.activeViewModePanel = this.state.viewModePanels.EDIT_SERVICE_LAYER
    this.state.selectedDisplayMode.next(this.state.displayModes.VIEW)
  }

  mapStateToThis (reduxState) {
    // Make a copy of data items because the UI component will mutate them directly
    return {
      authPermissions: reduxState.user.authPermissions,
      dataItems: getDataItemsCopy(reduxState)
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      selectDataItems: (dataItemKey, selectedLibraryItems) => dispatch(PlanActions.selectDataItems(dataItemKey, selectedLibraryItems))
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }
}

DataSelectionController.$inject = ['$http', '$timeout', '$rootScope', '$ngRedux', 'state']

// Component did not work when it was called 'dataSelection'
let planDataSelection = {
  templateUrl: '/components/sidebar/plan-settings/plan-data-selection/plan-data-selection.html',
  bindings: {
    userId: '<',
    planId: '<',
    key: '<',
    onChange: '&'
  },
  controller: DataSelectionController
}

export default planDataSelection
