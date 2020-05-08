import PlanActions from '../../../../react/components/plan/plan-actions'
import EtlTemplateActions from '../../../../react/components/etl-templates/etl-templates-actions'

class DataSourceUploadController {
  constructor ($http, $timeout, $ngRedux, state) {
    this.state = state
    this.$http = $http
    this.$timeout = $timeout
    this.conicTileSystemUploaderApi = null // Will be set if the conic tile uploader is active
    this.editingDataset = {
      name: ''
    }
    this.isUpLoad = false
    this.isUpLoading = false
    this.datasourceName = ''

    this.saCreationTypes = [
      { id: 'upload_file', label: 'Upload From File' },
      { id: 'polygon_equipment', label: 'Create Polygon From Equipment' },
      { id: 'draw_polygon', label: 'Draw service areas on map' }
    ]
    // ToDo: get this from service odata once implemented 
    this.conduitSizes = [
      { id: 1, name: 'small', description: 'Small' },
      { id: 2, name: 'medium', description: 'Medium' },
      { id: 3, name: 'large', description: 'Large' }
    ]
    this.saCreationType
    this.selectedEquipment
    this.selectedConduitSize = this.conduitSizes[0].id

    // Get all spatial edge types from server
    this.spatialEdgeTypes = []
    $http.get('/service/odata/SpatialEdgeTypeEntity')
      .then(result => {
        this.spatialEdgeTypes = result.data
        this.selectedSpatialEdgeType = this.spatialEdgeTypes[0]
        $timeout()
      })
      .catch(err => console.error(err))

    this.cableTypes = []
    $http.get('/service/odata/FiberTypeEntity')
      .then(result => {
        this.cableTypes = result.data
        this.selectedCableType = this.cableTypes[0]
        $timeout()
      })
      .catch(err => console.error(err))

    // Default Polygon radius in meters
    this.radius = 20000

    var form = null

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

          // form = $('#data_source_upload_modal form').get(0)
          form = $('#data_source_upload_modal_form').get(0)
        }
      }, 0)
    })
    
    // ---
    this.tableSource = this.uploadSource = this.state.uploadDataSource
    this.tableSources = angular.copy(this.uploadDataSources)
    this.rootSourceDescs = {}
    
    this.rows = []

    this.displayProps = [
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
      }, 
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
      }
    ]
    
    this.idProp = 'identifier' // unique id of each row
    
    this.actions = [
      {
        buttonText: 'Delete', // Delete
        buttonClass: 'btn-outline-danger',
        iconClass: 'fa-trash-alt',
        toolTip: 'Delete',
        isEnabled: (row, index) => {
          return this.canEdit(row)
        },
        callBack: (row, index) => {
          this.onDeleteRequest(row)
        }
      }
    ]
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  canEdit (row) {
    return this.state.loggedInUser.hasPermissions(this.state.authPermissionsByName['RESOURCE_ADMIN'].permissions, row.permissions)
  }

  close () {
    this.state.showDataSourceUploadModal.next(false)
    this.isDataManagementView = false
  }

  modalShown () {

    this.loadEtlTemplatesFromServer(1)
    this.state.showDataSourceUploadModal.next(true)
    
    this.tableSource = this.uploadSource = this.state.uploadDataSource = this.uploadDataSources[0]
    this.tableSources = [{'label':'all', 'name':'all'}].concat( this.uploadDataSources )
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
    
    this.uploadSource = this.tableSources[this.state.selectedDataTypeId]
    this.state.uploadDataSource = this.tableSource = this.uploadSource
  }

  modalHide () {
    this.state.showDataSourceUploadModal.next(false)
    this.isDataManagementView = false
    this.state.selectedDataTypeId = 1
  }

  onInitConicUploader (api) {
    this.conicTileSystemUploaderApi = api
  }

  onDestroyConicUploader () {
    this.conicTileSystemUploaderApi = null
  }
  
  
  save () {
    if (this.conicTileSystemUploaderApi) {
      // We have a conic system uploader API, so the upload will be handled by the control
      // Close dialog only after save is done, otherwise the FileList in the child control resets to 0
      this.isUploading = true
      this.conicTileSystemUploaderApi.save()
        .then((result) => {
          this.addDatasource(JSON.parse(result.data))
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
          this.selectDataItems('service_layer', [result])
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
        this.setCableConstructionType()
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
      url: '/service/v1/library-entry',
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
      url: '/service/v1/project/' + this.state.loggedInUser.projectId + '/serviceLayers-cmd',
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
        this.setAllLibraryItems('service_layer', this.dataItems['service_layer'].allLibraryItems.concat(e.data.serviceLayerLibrary))
        this.isUpLoad = false
        this.close()
      })
  }

  setCableConstructionType () {
    var cableOptions = {
      url: `/service/v1/library_cable`,
      method: 'POST',
      data: {
        libraryItem: {
          dataType: this.state.uploadDataSource.name,
          name: $('#data_source_upload_modal input[type=text]').get(0).value
        },
        param: {
          defaultCableSize: this.selectedConduitSize,
          param_type: 'cable_param',
          spatialEdgeType: this.selectedSpatialEdgeType.name
        }
      },
      json: true
    }

    if (!this.selectedSpatialEdgeType.conduit) {
      // This is not a conduit, also send the fiber type
      cableOptions.data.param.fiberType = this.selectedCableType.name
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
    this.loadEtlTemplatesFromServer(this.uploadSource.id)
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
      uploadDataSources: reduxState.plan.uploadDataSources,
      etlTemplates: reduxState.etlTemplates
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      selectDataItems: (dataItemKey, selectedLibraryItems) => dispatch(PlanActions.selectDataItems(dataItemKey, selectedLibraryItems)),
      setAllLibraryItems: (dataItemKey, allLibraryItems) => dispatch(PlanActions.setAllLibraryItems(dataItemKey, allLibraryItems)),
      loadEtlTemplatesFromServer: (dataType) => dispatch(EtlTemplateActions.loadEtlTemplatesFromServer(dataType))
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }
}

DataSourceUploadController.$inject = ['$http', '$timeout', '$ngRedux', 'state']

let globalDataSourceUploadModal = {
  templateUrl: '/components/sidebar/plan-settings/plan-data-selection/data-source-upload-modal.html',
  bindings: {},
  controller: DataSourceUploadController
}

export default globalDataSourceUploadModal
