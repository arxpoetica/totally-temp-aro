class DataSourceUploadController {
  constructor ($http, $timeout, state, aclManager) {
    this.state = state
    this.$http = $http
    this.$timeout = $timeout
    this.aclManager = aclManager
    this.conicTileSystemUploaderApi = null // Will be set if the conic tile uploader is active
    this.editingDataset = {
      name: ''
    }
    this.isUpLoad = false
    this.isUpLoading = false
    //this.dataSourceMeta = {} // Metadata for a data source (e.g. isLoading)

    this.saCreationTypes = [
      { id: 'upload_file', label: 'Upload From File' },
      { id: 'polygon_equipment', label: 'Create Polygon From Equipment' },
      { id: 'draw_polygon', label: 'Draw service areas on map' }
    ]
    this.saCreationType
    this.selectedEquipment

    this.cableTypes = ['FEEDER', 'DISTRIBUTION', 'IOF', 'UNKNOWN', 'COPPER']
    this.selectedcableType = this.cableTypes[0]
    // Default Polygon radius in meters
    this.radius = 20000

    var form

    this.isDataManagementView = false

    this.downloads = {
      location: {fileName: 'template_locations.zip'},
      equipment: {fileName: 'template_equipment.csv'},
      fiber: {fileName: 'sample_fiber.zip'},
      construction_location: {fileName: 'template_construction_locations.zip'},
      service_layer: {fileName: 'sample_service_area.zip'},
      tile_system: {fileName: 'example_upload_tile_system.csv'},
      edge: {fileName: 'sample_edges.zip'}
    }

    state.showDataSourceUploadModal.subscribe((newValue) => {
      setTimeout(function () {
        if ($('#data_source_upload_modal input[type=file]').get(0) &&
            $('#data_source_upload_modal input[type=text]').get(0)) { // Added IF for now. All this must go!
          $('#data_source_upload_modal input[type=file]').get(0).value = ''
          $('#data_source_upload_modal input[type=text]').get(0).value = ''

          form = $('#data_source_upload_modal form').get(0)
        }
      }, 0)
    })
    
    
    
    
    // ---
    
    
    this.tableSource = this.uploadSource = this.state.uploadDataSource
    this.tableSources = this.uploadSources = this.state.uploadDataSources
    this.rootSourceDescs = {}
    
    this.rows = []

    this.displayProps = [
      {
        'propertyName': 'dataType', 
        'levelOfDetail': 0,
        'format': '',
        'displayName': 'Data Type',
        'enumTypeURL': '',
        'displayDataType': 'string',
        'defaultValue': '',
        'editable': false,
        'visible': true
      },
      {
        'propertyName': 'name',
        'levelOfDetail': 0,
        'format': '',
        'displayName': 'Name',
        'enumTypeURL': '',
        'displayDataType': 'string',
        'defaultValue': '',
        'editable': true,
        'visible': true
      }/*, 
      {
        'propertyName': 'permissionsView',
        'levelOfDetail': 0,
        'format': '',
        'displayName': 'Permissions',
        'enumTypeURL': '',
        'displayDataType': 'string',
        'defaultValue': '',
        'editable': false,
        'visible': true
      }*/
    ]
    
    this.idProp = 'identifier' // unique id of each row
    
    this.actions = [
      {
        buttonText: 'Delete', // Delete
        buttonClass: 'btn-outline-danger',
        iconClass: 'fa-trash-alt',
        toolTip: 'Delete',
        callBack: (row, index) => {
          this.onDeleteRequest(row)
        }
      }
    ]
    
    
    // ---
    
  }

  close () {
    this.state.showDataSourceUploadModal.next(false)
    this.isDataManagementView = false
  }

  modalShown () {
    this.state.showDataSourceUploadModal.next(true)
    
    this.tableSource = this.uploadSource = this.state.uploadDataSource
    this.uploadSources = this.state.uploadDataSources
    this.tableSources = [{'label':'all', 'name':'all'}].concat( this.state.uploadDataSources )
    // some of the sources are alaises for others (construction_location for location)
    // and we want to avoid duplications 
    this.rootSourceDescs = {}
    this.state.uploadDataSources.forEach((uploadSource) => {
      var name = uploadSource.name
      if (!!uploadSource.proxyFor) name = uploadSource.proxyFor
      if (!this.rootSourceDescs.hasOwnProperty(name)){ 
        this.rootSourceDescs[name] = uploadSource.name
      }else{
        this.rootSourceDescs[name] += ", "+uploadSource.name
      }
    })
    
  }

  modalHide () {
    this.state.showDataSourceUploadModal.next(false)
    this.isDataManagementView = false
  }

  onInitConicUploader (api) {
    this.conicTileSystemUploaderApi = api
  }

  onDestroyConicUploader () {
    this.conicTileSystemUploaderApi = null
  }
  
  /*
  registerSaveAccessCallback (saveResourceAccess) {
    // We will call this function in resource-permissions-editor when we want to save the access settings for a data source.
    // Note that this will get overwritten every time we open a datasources access editor (and only one editor can be active at a time).
    this.saveResourceAccess = saveResourceAccess
  }
  
  saveAccessSettings (dataSource) {
    console.log(dataSource)
    // This will call a function into the resource permissions editor that will do the actual save
    if (this.saveResourceAccess) {
      this.saveResourceAccess()
        .then(() => Promise.all([
          this.state.loadPlanDataSelectionFromServer(),
          this.state.loadPlanResourceSelectionFromServer(),
          this.state.loadNetworkConfigurationFromServer(),
          this.toggleDataSourceExpanded(dataSource)
        ]))
        .then(() => this.state.uploadDataSource = this.state.uploadDataSources.filter(item => item.name === dataSource.dataType)[0])
        .catch((err) => console.error(err))
    }
  }
  */
  
  save () {
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
            if (this.state.uploadDataSource.name === 'service_layer' && this.saCreationType.id === 'polygon_equipment') { this.layerBoundary(this.selectedEquipment.identifier, library.identifier) } else { this.submit(library.identifier) }
          })
      }
    }
  }

  getLibraryId () {
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

  submit (libraryId) {
    this.isUpLoad = true
    var fd = new FormData()
    var file = $('#data_source_upload_modal input[type=file]').get(0).files[0]
    fd.append('file', file)
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
    })
  }

  layerBoundary (equipmentLibraryId, serviceLayerLibraryId) {
    var boundaryOptions = {
      url: '/service/v1/project/' + this.state.loggedInUser.projectId + '/serviceLayers-cmd?user_id=' + this.state.loggedInUser.id,
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

  setCableConstructionType (cableType) {
    var cableOptions = {
      url: '/service/v1/library_cable?user_id=' + this.state.loggedInUser.id,
      method: 'POST',
      data: {
        'libraryItem': {
          'dataType': this.state.uploadDataSource.name,
          'name': $('#data_source_upload_modal input[type=text]').get(0).value
        },
        'param': {
          'param_type': 'cable_param',
          'fiberType': cableType
        }
      },
      json: true
    }

    return this.$http(cableOptions)
      .then((response) => {
        this.submit(response.data.libraryItem.identifier)
      })
  }
  
  
  // --- date source table view --- //
  
  onUploadSourceChange () {
    this.state.uploadDataSource = this.tableSource = this.uploadSource
    this.loadDataSources()
  }
  
  onTableSourceChange () {
    if ('all' != this.tableSource.name){
      this.state.uploadDataSource = this.uploadSource = this.tableSource
    }
    this.loadDataSources()
  }
  
  deleteDatasource (dataSource) {
    this.$http.delete(`/service/v1/library-entry/${dataSource.identifier}?user_id=${this.state.loggedInUser.id}`)
      .then(() => {
        this.state.dataItems[dataSource.dataType].allLibraryItems = this.state.dataItems[dataSource.dataType].allLibraryItems.filter(item => item.identifier !== dataSource.identifier)
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
    this.state.dataItems[data.dataType].allLibraryItems.push(data)
  }
  
  loadDataSources () {
    if (!this.tableSource) {
      return // When items in state.js are being refreshed, state.uploadDataSource may be null as the combobox has a two-way binding to the model.
    }
    if (this.isDataManagementView) {
      //var aclPromises = [] // For each data source, get the effective ACL permissions and then allow/disallow editing
      //this.dataSourceMeta = {}
      //var indexToIdentifier = {}
      
      this.rows = []
      
      this.state.uploadDataSources.forEach((uploadSource) => {
        if (('all' == this.tableSource.name && !uploadSource.proxyFor) || uploadSource.name == this.tableSource.name){
          this.state.dataItems[uploadSource.name].allLibraryItems.forEach((item, index) => {
            item.id = item.identifier // we need to standardize ID property names
            if ('all' == this.tableSource.name && this.rootSourceDescs.hasOwnProperty(item.dataType)){
              item.dataType = this.rootSourceDescs[item.dataType]
            }
            this.rows.push(item)
            
            /*
            this.dataSourceMeta[item.identifier] = {
              isExpanded: false,
              isEditableByUser: false
            }
            indexToIdentifier[index] = item.identifier
            aclPromises.push(this.aclManager.getEffectivePermissions('LIBRARY', item.identifier, this.state.loggedInUser))
            */
          })
        }
      })
      //console.log(this.rows)
      /*
      Promise.all(aclPromises)
        .then(results => {
          // We have permissions for all data sources. Now set the editable flag so that the permissions show up all at once.
          results.forEach((dataSourcePermissions, index) => {
            this.dataSourceMeta[indexToIdentifier[index]].isEditableByUser = dataSourcePermissions && (dataSourcePermissions.ADMIN || dataSourcePermissions.IS_SUPERUSER)
          })
          this.$timeout()
          console.log(this.dataSourceMeta)
        })
        .catch(err => console.error(err))
      */
    }
  }
  
  /*
  toggleDataSourceExpanded (dataSource) {
    const newValue = !this.dataSourceMeta[dataSource.identifier].isExpanded
    // Collapse all datasources, then expand/collapse the selected one
    this.state.dataItems[this.state.uploadDataSource.name].allLibraryItems.forEach((item, index) => this.dataSourceMeta[item.identifier].isExpanded = false)
    this.dataSourceMeta[dataSource.identifier].isExpanded = newValue
  }
  */
  
  
  
  toggleView () {
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
