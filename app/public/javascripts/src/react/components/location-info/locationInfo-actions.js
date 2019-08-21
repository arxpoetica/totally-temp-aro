/* global swal */
import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'


// Fetch the getLocationInfo
function getLocationInfo (planId,id) {
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


export default {
  getLocationInfo: getLocationInfo,
}
