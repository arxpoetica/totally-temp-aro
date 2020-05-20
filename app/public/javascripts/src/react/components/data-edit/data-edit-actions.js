import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'
import uuidStore from '../../../shared-utils/uuid-store'
// import TileDataService from '../../../components/tiles/tile-data-service'

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

function uploadDucts (libraryId) {
  return (dispatch, getState) => {
    dispatch({
      type: Actions.DATA_SET_IS_EDIT_PROCESSING,
      payload: true
    })

    var onComplete = () => {
      dispatch({
        type: Actions.DATA_SET_IS_EDIT_PROCESSING,
        payload: false
      })
    }

    var onError = (err) => {
      console.error(err)
      onComplete()
      // swal
    }

    const state = getState()
    const ducts = state.dataEdit.ductEdit.ducts
    const userId = state.user.loggedInUser.id
    var deleteList = {
      'deletedEdges': []
    }
    var fileExtension = 'KML'
    // convert state.ducts to KML
    var ductsList = []
    Object.keys(ducts).forEach(key => {
      ductsList.push(ducts[key])
    })
    var fileData = pathsToKML(ductsList)
    console.log(fileData)
    // append to form data and upload
    var form = new FormData()
    form.append('file', new File([fileData], {type:'text/plain'}), 'ManuallyAddedDucts.kml')
    var url = `/uploadservice/v1/library/${libraryId}?userId=${userId}&media=${fileExtension}`

    AroHttp.postRaw(url, form)
      .then(result => {
        console.log(result)
        // dispatch(Actions.)
        AroHttp.put(`/service/conduits/${libraryId}/fiber?user_id=${userId}`, deleteList)
          .then(result => {
            dispatch(deleteAllDucts())
            // TileDataService.markHtmlCacheDirty()
            // dispatch upload complete
            onComplete()
          }).catch(err => onError(err))
      }).catch(err => onError(err))
  }
}

// ToDo: make this a utility
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

export default {
  setSelectedDuctId,
  deleteAllDucts,
  deleteDuct,
  newDuct,
  setDuct,
  uploadDucts
}
