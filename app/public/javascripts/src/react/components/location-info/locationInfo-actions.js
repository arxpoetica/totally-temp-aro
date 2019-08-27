import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'

// Fetch the getLocationInfo
function setLocationInfo (planId, id) {
  return dispatch => {
    AroHttp.get(`/locations/${planId}/${id}/show`)
      .then(result => {
        if (result.data) {
          dispatch({ type: Actions.LOCATIONINFO_SET, payload: result.data })
        }
      })
      .catch(err => console.error(err))
  }
}

function getLocationAuditLog (planId, id) {
  return dispatch => {
    AroHttp.get(`/service/audit/location/trail/bd983214-6cd9-11e9-8e12-9fd844c9846b?plan_id=${planId}`)
      .then(result => {
        if (result.data) {
          dispatch({ type: Actions.LOCATIONINFO_SHOW_AUDIT_LOG, payload: result.data })
        }
      })
      .catch(err => console.error(err))
  }
}

export default {
  setLocationInfo: setLocationInfo,
  getLocationAuditLog: getLocationAuditLog
}
