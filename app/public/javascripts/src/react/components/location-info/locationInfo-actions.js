/* global swal */
import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'


// Fetch the getLocationInfo
function getLocationInfo (planId,id) {
  return dispatch => {
    AroHttp.get(`/locations/${planId}/${id}/show`)
      .then(result => {
        // Update the coverage status only if we have a valid report
        const data = result.data
        if (data) {
          dispatch({ type: Actions.LOCATIONINFO, payload: { Data: data} })
        }
        
      })
      .catch(err => console.error(err))
  }
}


export default {
  getLocationInfo: getLocationInfo,
}
