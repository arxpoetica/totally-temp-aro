import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'
import PlanActions from '../plan/plan-actions'
import ToolBarActions from '../header/tool-bar-actions'
import GlobalSettingsActions from '../global-settings/globalsettings-action'

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

function createLibraryId (uploadDetails, loggedInUser) {
  // First, add some hardcoded values to the tile system params before sending it to the API.
  var postBody = {
    libraryItem: {
      dataType: 'tile_system',
      name: uploadDetails.dataSourceName
    },
    param: JSON.parse(JSON.stringify(uploadDetails.editedTileSystemData))
  }
  postBody.param.param_type = 'ts'

  // Then make the call that will provide us with the library id
  return AroHttp.post(`/service/v1/project/${loggedInUser.projectId}/library_ts`, postBody)
    .then((result) => Promise.resolve(result.data.libraryItem))
    .catch((err) => console.error(err))
}

function saveDataSource (uploadDetails,loggedInUser) {

  return dispatch => {

    dispatch(setIsUploading(true))

    if(uploadDetails.selectedDataSourceName === 'tile_system'){

      return createLibraryId(uploadDetails,loggedInUser)
      .then((libraryItem) => {
        fileUpload(uploadDetails,libraryItem.identifier,loggedInUser) 
        dispatch(setAllLibraryItems(libraryItem.dataType, libraryItem))
      })
      .then((result) => {
        dispatch(setIsUploading(false))
        return Promise.resolve(result)
      })
      .catch((err) => {
        dispatch(setIsUploading(false))
        console.error(err)
      })
    } else {
      if (uploadDetails.selectedDataSourceName === 'service_layer' && uploadDetails.selectedCreationType === 'draw_polygon') {
        // Just create Datasource
        getLibraryId (uploadDetails)
        .then((library) => {
          // Put the application in "Edit Service Layer" mode
          dispatch(setAllLibraryItems(library.data.dataType, library.data))
          dispatch(PlanActions.selectDataItems('service_layer', [library.data]))
          dispatch(GlobalSettingsActions.setShowGlobalSettings(false))
          dispatch(PlanActions.setIsDataSelection(false))
          dispatch(ToolBarActions.selectedDisplayMode('VIEW'))
          dispatch(ToolBarActions.activeViewModePanel('EDIT_SERVICE_LAYER'))
        })
        .then((result) => {
          dispatch(setIsUploading(false))
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
            }, 
            fileUpload(uploadDetails,uploadDetails.dataSetId))
          }
        }
        // For uploading fiber no need to create library using getLibraryId()
        if (uploadDetails.selectedDataSourceName === 'fiber') {
          return setCableConstructionType(uploadDetails,loggedInUser)
          .then((libraryItem) => {
            dispatch(setAllLibraryItems(libraryItem.dataType, libraryItem)),
            fileUpload(uploadDetails, libraryItem.identifier, loggedInUser)
          })
          .then((result) => {
            dispatch(setIsUploading(false))
            return Promise.resolve(result)
          })
          .catch((err) => {
            dispatch(setIsUploading(false))
          })
        } else {
          getLibraryId (uploadDetails)
            .then((library) => {
              if (uploadDetails.selectedDataSourceName === 'service_layer' && uploadDetails.selectedCreationType === 'polygon_equipment') { 
                layerBoundary(uploadDetails, library.data.identifier,loggedInUser) 
              } else {
                if(uploadDetails.selectedDataSourceName !== 'edge'){
                  fileUpload(uploadDetails,library.data.identifier,loggedInUser) 
                }
              }
              dispatch(setAllLibraryItems(library.data.dataType, library.data))
            })
            .then((res) => {
              dispatch(setIsUploading(false))
            })
            .catch((err) => {
              dispatch(setIsUploading(false))
              console.error(err)
            })
        }
      }
    }
  }
}

function getLibraryId (uploadDetails) {
  return AroHttp.post('/service/v1/library-entry', { dataType: uploadDetails.selectedDataSourceName, name: uploadDetails.dataSourceName})
  .then((response) => {
    return Promise.resolve(response)
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
    .then((result) => Promise.resolve(result.data.libraryItem))
    .catch((err) => console.error(err))
}

function fileUpload (uploadDetails,libraryId,loggedInUser) {
  var formData = new FormData()
  var file = uploadDetails.file
  formData.append('file', file)

  var fileExtension = file.name.substr(file.name.lastIndexOf('.') + 1).toUpperCase()
  var url = `/uploadservice/v1/library/${libraryId}?userId=${loggedInUser.id}&media=${fileExtension}`
  
  AroHttp.postRaw(url, formData).then((e) => {
    
  }).catch((e) => {
    swal('Error', e.statusText, 'error')
  })
}

function setIsUploading (status){
  return dispatch => {
    dispatch({
      type: Actions.DATA_UPLOAD_SET_IS_UP_LOADING,
      payload: status
    })
  }
}

function setAllLibraryItems (dataItemKey, allLibraryItems) {
  return dispatch => {
    dispatch({
      type: Actions.PLAN_SET_ALL_LIBRARY_ITEMS_ADD,
      payload: {
        dataItemKey : dataItemKey,
        allLibraryItems : allLibraryItems
      }
    })
  }
}

export default {
  loadMetaData,
  toggleView,
  saveDataSource,
  getLibraryId,
  fileUpload,
  layerBoundary,
  setCableConstructionType,
  createLibraryId,
  setIsUploading,
  setAllLibraryItems
}