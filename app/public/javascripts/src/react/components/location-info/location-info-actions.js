import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'

// Fetch the getLocationInfo
function getLocationInfo (planId, id) {
  return dispatch => {
    AroHttp.get(`/locations/${planId}/${id}/show`)
      .then(result => {
        if (result.data) {
          dispatch({ type: Actions.LOCATION_INFO_SET_DETAILS, payload: result.data })
        }
      })
      .catch(err => console.error(err))
  }
}

function clearLocationInfo () {
  return {
    type: Actions.LOCATION_INFO_SET_DETAILS,
    payload: null
  }
}

function getLocationAuditLog (planId, objectId) {
  return dispatch => {
    AroHttp.get(`/service/audit/location/trail/${objectId}?plan_id=${planId}`)
      .then(result => {
        if (result.data) {
          dispatch({ type: Actions.LOCATION_INFO_SET_AUDIT_LOG, payload: result.data })
        }
      })
      .catch(err => console.error(err))
  }
}

export default {
  getLocationInfo,
  clearLocationInfo,
  getLocationAuditLog
}
