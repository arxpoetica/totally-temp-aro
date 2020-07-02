import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'

function loadMetaData () {

  return dispatch => {
    AroHttp.get(`/service/odata/SpatialEdgeTypeEntity`)
    .then(result => dispatch({
      type: Actions.DATA_UPLOAD_SET_EDGE_TYPE,
      payload: result.data
    }))
    .catch((err) => console.error(err))

    AroHttp.get(`/service/odata/FiberTypeEntity`)
    .then(result => dispatch({
      type: Actions.DATA_UPLOAD_SET_CABLE_TYPE,
      payload: result.data
    }))
    .catch((err) => console.error(err))
  }
}

function toggleView (viewName) {
  return dispatch => {
    dispatch({
      type: Actions.DATA_UPLOAD_TOGGLE_VIEW,
      payload: viewName
    })
  }
}

function saveDataSource (uploadDetails,loggedInUser) {

  return dispatch => {
    if (uploadDetails.selectedDataSourceName === 'service_layer' && uploadDetails.selectedCreationType === 'draw_polygon') {
      return getLibraryId(uploadDetails) // Just create Datasource
        .then((result) => {
          dispatch({
            type: Actions.DATA_UPLOAD_UPDATE_DATASOURCES,
            payload: result
          })
        })
      // Draw the layer by entering edit mode
    } else {
      if (uploadDetails.selectedDataSourceName !== 'service_layer' || uploadDetails.selectedCreationType !== 'polygon_equipment') {
        var files = uploadDetails.file
        if (uploadDetails.dataSetId && files.length > 0) {
          return swal({
            title: 'Are you sure?',
            text: 'Are you sure you want to overwrite the data which is currently in this boundary layer?',
            type: 'warning',
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'Yes',
            showCancelButton: true,
            closeOnConfirm: true
          }, fileUpload(uploadDetails,uploadDetails.dataSetId))
        }
      }
      // For uploading fiber no need to create library using getLibraryId()
      if (uploadDetails.selectedDataSourceName === 'fiber') {
        setCableConstructionType(uploadDetails,loggedInUser)
      } else {
        AroHttp.post('/service/v1/library-entry', { dataType: uploadDetails.selectedDataSourceName, name: uploadDetails.dataSourceName})
          .then((library) => {
            if (uploadDetails.selectedDataSourceName === 'service_layer' && uploadDetails.selectedCreationType === 'polygon_equipment') { 
              layerBoundary(uploadDetails, library.data.identifier,loggedInUser) 
            } else { 
              fileUpload(uploadDetails,library.data.identifier,loggedInUser) 
            }
          })
      }
    }
  }
}

function getLibraryId (uploadDetails) {
  console.log(uploadDetails)
  AroHttp.post('/service/v1/library-entry', { dataType: uploadDetails.selectedDataSourceName, name: uploadDetails.dataSourceName})
  .then((response) => {
    return Promise.resolve(response.data)
  })
  .catch((err) => console.error(err))
}

function  layerBoundary (uploadDetails, serviceLayerLibraryId,loggedInUser) {
  var data = {
    action: 'GENERATE_POLYGONS',
    maxDistanceMeters: uploadDetails.radius,
    equipmentLibraryId: uploadDetails.selectedEquipment,
    serviceLayerLibraryId: serviceLayerLibraryId
  }

  return AroHttp.post('/service/v1/project/' + loggedInUser.projectId + '/serviceLayers-cmd', data)
    .then((e) => {
      //this.setAllLibraryItems('service_layer', this.dataItems['service_layer'].allLibraryItems.concat(e.data.serviceLayerLibrary))
      
    })
}

function setCableConstructionType (uploadDetails,loggedInUser) {
  var data = {
    libraryItem: {
      dataType: uploadDetails.selectedDataSourceName,
      name: uploadDetails.dataSourceName
    },
    param: {
      defaultCableSize: uploadDetails.selectedConduitSize,
      param_type: 'cable_param',
      spatialEdgeType: uploadDetails.selectedSpatialEdgeType
    }
  }

  if (uploadDetails.selectedSpatialEdgeType === 'fiber') {
    // This is not a conduit, also send the fiber type
    data.param.fiberType = uploadDetails.selectedCableType
  }
  return AroHttp.post(`/service/v1/library_cable`,data)
    .then((response) => {
      fileUpload(uploadDetails,response.data.libraryItem.identifier,loggedInUser)
    })
}

function fileUpload (uploadDetails,libraryId,loggedInUser) {
  var formData = new FormData()
  var file = uploadDetails.file
  formData.append('file', file)

  var fileExtension = file.name.substr(file.name.lastIndexOf('.') + 1).toUpperCase()
  var url = `/uploadservice/v1/library/${libraryId}?userId=${loggedInUser.id}&media=${fileExtension}`
  
  AroHttp.postRaw(url, formData).then((e) => {
    loadMetaData()
  }).catch((e) => {
    swal('Error', e.statusText, 'error')
  })
}

export default {
  loadMetaData,
  toggleView,
  saveDataSource,
  getLibraryId,
  fileUpload,
  layerBoundary,
  setCableConstructionType
}
