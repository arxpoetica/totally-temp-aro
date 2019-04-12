/* globals FormData */
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

function saveConfigurationToServerAndReload (type, configuration) {
  return dispatch => {
    AroHttp.post(`/ui_settings/save/${type}`, { configuration: configuration })
      .then(result => dispatch(loadConfigurationFromServer))
      .catch(err => console.error(err))
  }
}

function uploadAssetToServer (assetKey, file) {
  return dispatch => {
    var formData = new FormData()
    formData.append('file', file)

    AroHttp.postRaw(`/ui_assets/${assetKey}`, formData) // Important to send empty headers so file upload works
      .catch(err => console.error(err))
  }
}

export default {
  loadConfigurationFromServer: loadConfigurationFromServer,
  saveConfigurationToServerAndReload: saveConfigurationToServerAndReload,
  uploadAssetToServer: uploadAssetToServer
}
