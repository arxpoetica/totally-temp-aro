class DataSourceUploadController {
  
  constructor($http, state) {
    this.state = state
    this.$http = $http
    this.userId = state.getUserId()
    this.projectId = state.getProjectId()
    this.conicTileSystemUploaderApi = null  // Will be set if the conic tile uploader is active
    this.editingDataset = {
      name: ''
    }
    this.isUpLoad = false
    this.dataSources

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

  save() {

    if (this.conicTileSystemUploaderApi) {
      // We have a conic system uploader API, so the upload will be handled by the control
      this.conicTileSystemUploaderApi.save()
      this.close()
    } else {
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

      this.getLibraryId()
        .then((libraryId) => {
          this.submit(libraryId)
        })
    }
  }

  getLibraryId() {
    //To polpulate the service area we have to generate the equipment
    //Finally function (layerBoundary) populate the service area
    var dataType = this.state.uploadDataSource.name === 'service_layer' ? 'equipment' : this.state.uploadDataSource.name

    var libraryOptions = {
      url: '/service/v1/project/' + this.projectId + '/library?user_id=' + this.userId,
      method: 'POST',
      data: {
        dataType: dataType,
        name: $('#data_source_upload_modal input[type=text]').get(0).value
      },
      json: true
    }

    return this.$http(libraryOptions)
    .then((response) => {
      return Promise.resolve(response.data.identifier)
    })
  }

  submit(libraryId) {
    this.isUpLoad = true
    var fd = new FormData();
    var file = $('#data_source_upload_modal input[type=file]').get(0).files[0]
    fd.append("file", file);
    var fileExtension = file.name.substr(file.name.lastIndexOf('.') + 1).toUpperCase()
    var url = `/uploadservice/v1/library/${libraryId}?userId=${this.userId}&media=${fileExtension}`
    
    this.$http.post(url, fd, {
      withCredentials: true,
      headers: { 'Content-Type': undefined },
      transformRequest: angular.identity
    }).then((e) => {

      if(this.state.uploadDataSource.name === 'service_layer') {
        //load the eqipment boundary layer
        this.layerBoundary(libraryId)
      } else {
        this.addDatasource(JSON.parse(e.data))
      }
      this.isUpLoad = false
      this.close()
    }).catch((e) => {
      this.isUpLoad = false
      swal('Error', e.statusText, 'error')
    });
  }

  layerBoundary(libraryId) {
    var boundaryOptions = {
      url: '/service/v1/project/' + this.projectId + '/serviceLayers-cmd?user_id=' + this.userId,
      method: 'POST',
      data: {
        action: 'GENERATE_POLYGONS',
        maxDistanceMeters: $('#data_source_upload_modal input[type=number]').get(0).value,
        equipmentLibraryId: libraryId
        // serviceLayerLibraryId: libraryId
      },
      json: true
    }

    return this.$http(boundaryOptions)
    .then((e) => {
      this.state.dataItems['service_layer'].allLibraryItems.push(e.data.serviceLayerLibrary)
    })
  }

  removeDatasource(target) {
    this.$http.delete(`/service/v1/project/${this.projectId}/library/${target.target.identifier}?user_id=${this.userId}`).then(() => {
        var index = this.state.dataItems[target.target.dataType].allLibraryItems.indexOf(target.target)
        if(index > -1) {
          this.state.dataItems[target.target.dataType].allLibraryItems.splice(index, 1)
        }
    })
  }

  addDatasource(data) {
    this.state.dataItems[data.dataType].allLibraryItems.push(data)
  }

  loadDataSources() {
    if(this.isDataManagementView) {
      this.dataSources = this.state.dataItems[this.state.uploadDataSource.name].allLibraryItems
    }
  }

  toggleView() {
    this.isDataManagementView = !this.isDataManagementView
    this.loadDataSources()
  }

}

DataSourceUploadController.$inject = ['$http', 'state']

app.component('globalDataSourceUploadModal', {
  templateUrl: '/components/sidebar/plan-settings/plan-data-selection/data-source-upload-modal-component.html',
  bindings: {},
  controller: DataSourceUploadController
})