import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'

// Fetch the getLocationInfo
function getLocationInfo (planId, id) {
  return dispatch => {
    AroHttp.get(`/locations/${planId}/${id}/show`)
      .then(result => {
        if (result.data) {
          dispatch({ type: Actions.LOCATIONINFO_SHOW, payload: result.data })
        }
      })
      .catch(err => console.error(err))
  }
}

function getLocationAuditLog (planId, id) {
  return dispatch => {
    AroHttp.get(`/service/audit/location/trail/bd983214-6cd9-11e9-8e12-9fd844c9846b?plan_id=${planId}&user_id=4`)
      .then(result => {
        if (result.data) {
          dispatch({ type: Actions.LOCATIONAUDIT_LOG_SHOW, payload: result.data })
        }
      })
      .catch(err => console.error(err))
  }
}

export default {
  getLocationInfo: getLocationInfo,
  getLocationAuditLog: getLocationAuditLog
}
