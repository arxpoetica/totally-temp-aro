import PlanActions from '../../../../react/components/plan/plan-actions'

class ProjectSettingsController {
  constructor ($http, $timeout, $ngRedux, state) {
    this.state = state
    this.$http = $http
    
    state.showProjectSettingsModal.subscribe((newValue) => {
      setTimeout(function () {
        if ($('#data_source_upload_modal input[type=file]').get(0) &&
            $('#data_source_upload_modal input[type=text]').get(0)) { // Added IF for now. All this must go!
          $('#data_source_upload_modal input[type=file]').get(0).value = ''
          $('#data_source_upload_modal input[type=text]').get(0).value = ''

          // form = $('#data_source_upload_modal form').get(0)
          form = $('#data_source_upload_modal_form').get(0)
        }
      }, 0)
    })
    

    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  canEdit (row) {
    return this.state.loggedInUser.hasPermissions(this.state.authPermissionsByName['RESOURCE_ADMIN'].permissions, row.permissions)
  }

  close () {
    this.state.showProjectSettingsModal.next(false)
    this.isDataManagementView = false
  }

  modalShown () {
    this.state.showProjectSettingsModal.next(true)
        
  }

  modalHide () {
    this.state.showProjectSettingsModal.next(false)
    this.isDataManagementView = false
  }

  onInitConicUploader (api) {
    this.conicTileSystemUploaderApi = api
  }

  onDestroyConicUploader () {
    this.conicTileSystemUploaderApi = null
  }
  
  
  // --- date source table view --- //
  onUploadSourceChange () {
    this.state.uploadDataSource = this.tableSource = this.uploadSource
    this.loadDataSources()
  }
  
  onTableSourceChange () {
    if ('all' !== this.tableSource.name){
      this.state.uploadDataSource = this.uploadSource = this.tableSource
    }
    this.loadDataSources()
  }
  
  deleteDatasource (dataSource) {
    this.$http.delete(`/service/v1/library-entry/${dataSource.identifier}`)
      .then(() => {
        this.setAllLibraryItems(dataSource.dataType, this.dataItems[dataSource.dataType].allLibraryItems.filter(item => item.identifier !== dataSource.identifier))
        this.loadDataSources()
        this.$timeout()
      })
  }
  
  onDeleteRequest (dataSource) {
    this.askUserToConfirmManagerDelete(dataSource.name)
    .then((okToDelete) => {
      if (okToDelete) {
        this.deleteDatasource(dataSource)
      }
    })
    .catch((err) => console.error(err))
  }
  
  askUserToConfirmManagerDelete (name) {
    return new Promise((resolve, reject) => {
      swal({
        title: 'Delete data source?',
        text: `Are you sure you want to delete "${name}"?`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      }, (result) => {
        if (result) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }

  addDatasource (data) {
    this.setAllLibraryItems(data.dataType, this.dataItems[data.dataType].allLibraryItems.concat(data))
  }

  loadDataSources () {
    if (!this.tableSource) {
      return // When items in state.js are being refreshed, state.uploadDataSource may be null as the combobox has a two-way binding to the model.
    }
    if (this.isDataManagementView) {
      this.rows = []

      this.uploadDataSources.forEach((uploadSource) => {
        if (('all' == this.tableSource.name && !uploadSource.proxyFor) || uploadSource.name === this.tableSource.name) {
          this.dataItems[uploadSource.name].allLibraryItems.forEach((item, index) => {
            item.id = item.identifier // we need to standardize ID property names
            if ('all' == this.tableSource.name && this.rootSourceDescs.hasOwnProperty(item.dataType)) {
              item.dataType = this.rootSourceDescs[item.dataType]
            }
            this.rows.push(item)
            
          })
        }
      })
    }
  }
  
  toggleView () {
    this.isDataManagementView = !this.isDataManagementView
    this.loadDataSources()
  }

  mapStateToThis (reduxState) {
    return {
      dataItems: reduxState.plan.dataItems,
      uploadDataSources: reduxState.plan.uploadDataSources
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      selectDataItems: (dataItemKey, selectedLibraryItems) => dispatch(PlanActions.selectDataItems(dataItemKey, selectedLibraryItems)),
      setAllLibraryItems: (dataItemKey, allLibraryItems) => dispatch(PlanActions.setAllLibraryItems(dataItemKey, allLibraryItems))
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }
}

ProjectSettingsController.$inject = ['$http', '$timeout', '$ngRedux', 'state']

let projectSettingsModal = {
  templateUrl: '/components/sidebar/plan-settings/plan-data-selection/project-settings-modal.html',
  bindings: {},
  controller: ProjectSettingsController
}

export default projectSettingsModal
