import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'

function loadConfigurationFromServer () {
  return dispatch => {
    AroHttp.get('/configuration')
      .then(result => dispatch({
        type: Actions.CONFIGURATION_SET_CONFIGURATION,
        payload: result.data.appConfiguration
      }))
      .catch(err => console.error(err))
  }
}

export default {
  loadConfigurationFromServer: loadConfigurationFromServer
}
