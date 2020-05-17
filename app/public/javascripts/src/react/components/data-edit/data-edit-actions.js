import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'
import uuidStore from '../../../shared-utils/uuid-store'

function setSelectedDuctId (ductId) {
  return {
    type: Actions.DATA_DUCT_SET_SELECTED_DUCT_ID,
    payload: ductId
  }
}

function deleteAllDucts () {
  return {
    type: Actions.DATA_DUCT_SET_DUCTS,
    payload: {}
  }
}

function deleteDuct (ductId) {
  return {
    type: Actions.DATA_DUCT_DELETE_DUCT,
    payload: ductId
  }
}

function newDuct (duct) {
  var newDuctId = uuidStore.getUUID()
  return {
    type: Actions.DATA_DUCT_SET_DUCT,
    payload: {
      ductId: newDuctId,
      duct: duct
    }
  }
}

function setDuct (ductId, duct) {
  return {
    type: Actions.DATA_DUCT_SET_DUCT,
    payload: {
      ductId: ductId,
      duct: duct
    }
  }
}

function uploadDucts () {
  return (dispatch, getState) => {
    const state = getState()
    const ducts = state.dataEdit.ductEdit.ducts
    const libraryId = 25 // temporary
    var fileExtension = 'KML'
    // convert state.ducts to CSV
    var ductsList = []
    Object.keys(ducts).forEach(key => {
      ductsList.push(ducts[key])
    })
    var fileData = pathsToKML(ductsList)
    console.log(fileData)
    // append to form data and upload
    var form = new FormData()
    form.append('file', new Blob([fileData], {type:'text/plain'}), 'ManuallyAddedDucts.kml')
    var url = `/uploadservice/v1/library/${libraryId}?userId=${state.user.loggedInUser.id}&media=${fileExtension}`
    AroHttp.post(url, form)
      .then(result => {
        console.log(result)
        dispatch(deleteAllDucts())
        // dispatch upload complete
      }).catch(err => console.error(err))
  }
}

function pathsToKML (paths) {
  var kml = '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'
  paths.forEach(path => {
    kml += '<Placemark><LineString><coordinates>'
    path.geometry.forEach(coord => {
      kml += `${coord.lng()},${coord.lat()} `
    })
    // remove trailing space
    kml = kml.slice(0, -1)
    kml += '</coordinates></LineString></Placemark>'
  })
  kml += '</Document></kml>'
  return kml
}

/*
make new duct entry
postData = {
  "dataType": "fiber",
  "name": "Manually Added Ducts"
}
POST http://localhost:8083/v1/library-entry?user_id=4
*/

export default {
  setSelectedDuctId,
  deleteAllDucts,
  deleteDuct,
  newDuct,
  setDuct,
  uploadDucts
}
