class DataSourceUploadController {
  
  constructor($http, $timeout, state, aclManager) {
    this.state = state
    this.$http = $http
    this.$timeout = $timeout
    this.aclManager = aclManager
    this.projectId = state.loggedInUser.projectId
    this.conicTileSystemUploaderApi = null  // Will be set if the conic tile uploader is active
    this.editingDataset = {
      name: ''
    }
    this.isUpLoad = false
    this.isUpLoading = false
    this.dataSources

    this.saCreationTypes = [
      {id:"upload_file",label:"Upload From File"},
      {id:"polygon_equipment",label:"Create Polygon From Equipment"},
      {id:"draw_polygon",label:"Draw service areas on map"},
    ]
    this.saCreationType
    this.selectedEquipment

    this.cableTypes =  ["FEEDER", "DISTRIBUTION", "IOF", "UNKNOWN", "COPPER"]
    this.selectedcableType = this.cableTypes[0]
    //Default Polygon radius in meters
    this.radius = 20000

    var form;

    this.isDataManagementView = false

    state.showDataSourceUploadModal.subscribe((newValue) => {
      setTimeout(function () {
        if ($('#data_source_upload_modal input[type=file]').get(0)
            && $('#data_source_upload_modal input[type=text]').get(0)) {  // Added IF for now. All this must go!
          $('#data_source_upload_modal input[type=file]').get(0).value = ''
          $('#data_source_upload_modal input[type=text]').get(0).value = ''
          
          form = $('#data_source_upload_modal form').get(0)
        }
      }, 0)
    })

  }

  close() {
    this.state.showDataSourceUploadModal.next(false)
    this.isDataManagementView = false    
  }

  modalShown() {
    this.state.showDataSourceUploadModal.next(true)
  }

  modalHide() {
    this.state.showDataSourceUploadModal.next(false)
    this.isDataManagementView = false    
  }

  onInitConicUploader(api) {
    this.conicTileSystemUploaderApi = api
  }

  onDestroyConicUploader() {
    this.conicTileSystemUploaderApi = null
  }

  registerSaveAccessCallback(saveResourceAccess) {
    // We will call this function in resource-permissions-editor when we want to save the access settings for a data source.
    // Note that this will get overwritten every time we open a datasources access editor (and only one editor can be active at a time).
    this.saveResourceAccess = saveResourceAccess
  }

  saveAccessSettings(dataSource) {
    // This will call a function into the resource permissions editor that will do the actual save
    if (this.saveResourceAccess) {
      this.saveResourceAccess() 
        .then(() => Promise.all([
          this.state.loadPlanDataSelectionFromServer(),
          this.state.loadPlanResourceSelectionFromServer(),
          this.state.loadNetworkConfigurationFromServer(),
          this.toggleDataSourceExpanded(dataSource)
        ]))
        .catch((err) => console.error(err))
    }
  }

  save() {

    if (this.conicTileSystemUploaderApi) {
      // We have a conic system uploader API, so the upload will be handled by the control
      // Close dialog only after save is done, otherwise the FileList in the child control resets to 0
      this.isUploading = true
      this.conicTileSystemUploaderApi.save()
      .then(() => {
        this.isUploading = false
        this.close()
      })
      .catch((err) => {
        this.isUploading = false
        console.error(err)
      })
    } else if (this.state.uploadDataSource.name === 'service_layer' && this.saCreationType.id === 'draw_polygon') {
      this.getLibraryId() // Just create Datasource
      .then((result) => {
        this.isUploading = false
        this.close()
        this.addDatasource(result)
        // Put the application in "Edit Service Layer" mode
        this.state.dataItems.service_layer.selectedLibraryItems[0] = result
        this.state.selectedDisplayMode.next(this.state.displayModes.VIEW)
        this.state.activeViewModePanel = this.state.viewModePanels.EDIT_SERVICE_LAYER
        this.state.loadServiceLayers()
      })
      // Draw the layer by entering edit mode
    } else {
      if (this.state.uploadDataSource.name != 'service_layer' || this.saCreationType.id != 'polygon_equipment') {
        var files = $('#data_source_upload_modal input[type=file]').get(0).files
        if (this.editingDataset.id && files.length > 0) {
          return swal({
            title: 'Are you sure?',
            text: 'Are you sure you want to overwrite the data which is currently in this boundary layer?',
            type: 'warning',
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'Yes',
            showCancelButton: true,
            closeOnConfirm: true
          }, submit)
        }
      }
      // For uploading fiber no need to create library using getLibraryId()
      if (this.state.uploadDataSource.name === 'fiber') {
        this.setCableConstructionType(this.selectedcableType)
      } else {
      this.getLibraryId()
        .then((library) => {
          if (this.state.uploadDataSource.name === 'service_layer' && this.saCreationType.id === 'polygon_equipment')
            this.layerBoundary(this.selectedEquipment.identifier,library.identifier)
          else  
            this.submit(library.identifier)
        })
      }  
    }
  }

  getLibraryId() {
    var dataType = this.state.uploadDataSource.name

    var libraryOptions = {
      url: '/service/v1/library-entry?user_id=' + this.state.loggedInUser.id,
      method: 'POST',
      data: {
        dataType: dataType,
        name: $('#data_source_upload_modal input[type=text]').get(0).value
      },
      json: true
    }

    return this.$http(libraryOptions)
    .then((response) => {
      return Promise.resolve(response.data)
    })
  }

  submit(libraryId) {
    this.isUpLoad = true
    var fd = new FormData();
    var file = $('#data_source_upload_modal input[type=file]').get(0).files[0]
    fd.append("file", file);
    var fileExtension = file.name.substr(file.name.lastIndexOf('.') + 1).toUpperCase()
    var url = `/uploadservice/v1/library/${libraryId}?userId=${this.state.loggedInUser.id}&media=${fileExtension}`
    
    this.$http.post(url, fd, {
      withCredentials: true,
      headers: { 'Content-Type': undefined },
      transformRequest: angular.identity
    }).then((e) => {
      this.addDatasource(JSON.parse(e.data))
      this.isUpLoad = false
      this.close()
    }).catch((e) => {
      this.isUpLoad = false
      swal('Error', e.statusText, 'error')
    });
  }

  layerBoundary(equipmentLibraryId,serviceLayerLibraryId) {
    var boundaryOptions = {
      url: '/service/v1/project/' + this.projectId + '/serviceLayers-cmd?user_id=' + this.state.loggedInUser.id,
      method: 'POST',
      data: {
        action: 'GENERATE_POLYGONS',
        maxDistanceMeters: $('#data_source_upload_modal input[type=number]').get(0).value,
        equipmentLibraryId: equipmentLibraryId,
        serviceLayerLibraryId: serviceLayerLibraryId
      },
      json: true
    }

    return this.$http(boundaryOptions)
    .then((e) => {
      this.state.dataItems['service_layer'].allLibraryItems.push(e.data.serviceLayerLibrary)
      this.isUpLoad = false
      this.close()
    })
  }

  setCableConstructionType(cableType) {
    var cableOptions = {
      url: '/service/v1/library_cable?user_id=' + this.state.loggedInUser.id,
      method: 'POST',
      data: {
        "libraryItem": {
          "dataType": this.state.uploadDataSource.name,
          "name": $('#data_source_upload_modal input[type=text]').get(0).value
        },
        "param": {
          "param_type": "cable_param",
          "fiberType": cableType
        }
      },
      json: true
    }

    return this.$http(cableOptions)
    .then((response) => {
      this.submit(response.data.libraryItem.identifier)
    })
  }

  deleteDatasource(dataSource) {
    this.$http.delete(`/service/v1/library-entry/${dataSource.identifier}?user_id=${this.state.loggedInUser.id}`)
      .then(() => {
        var index = this.state.dataItems[dataSource.dataType].allLibraryItems.indexOf(dataSource)
        if(index > -1) {
          this.state.dataItems[dataSource.dataType].allLibraryItems.splice(index, 1)
        }
        this.$timeout()
      })
  }

  addDatasource(data) {
    this.state.dataItems[data.dataType].allLibraryItems.push(data)
  }

  loadDataSources() {
    if(this.isDataManagementView) {
      var aclPromises = []  // For each data source, get the effective ACL permissions and then allow/disallow editing
      this.dataSources = angular.copy(this.state.dataItems[this.state.uploadDataSource.name].allLibraryItems)
      this.dataSources.forEach((item, index) => {
        this.dataSources[index].isExpanded = false
        this.dataSources[index].isEditableByUser = false
        aclPromises.push(this.aclManager.getEffectivePermissions('LIBRARY', this.dataSources[index].identifier, this.state.loggedInUser))
      })
      Promise.all(aclPromises)
        .then(results => {
          // We have permissions for all data sources. Now set the editable flag so that the permissions show up all at once.
          results.forEach((dataSourcePermissions, index) => {
            this.dataSources[index].isEditableByUser = dataSourcePermissions && (dataSourcePermissions.ADMIN || dataSourcePermissions.IS_SUPERUSER)
          })
          this.$timeout()
        })
        .catch(err => console.error(err))
    }
  }

  toggleDataSourceExpanded(dataSource) {
    const newValue = !dataSource.isExpanded
    // Collapse all datasources, then expand/collapse the selected one
    this.dataSources.forEach((item, index) => this.dataSources[index].isExpanded = false)
    dataSource.isExpanded = newValue
  }

  toggleView() {
    this.isDataManagementView = !this.isDataManagementView
    this.loadDataSources()
  }

}

DataSourceUploadController.$inject = ['$http', '$timeout', 'state', 'aclManager']

let globalDataSourceUploadModal = {
  templateUrl: '/components/sidebar/plan-settings/plan-data-selection/data-source-upload-modal.html',
  bindings: {},
  controller: DataSourceUploadController
}

export default globalDataSourceUploadModal