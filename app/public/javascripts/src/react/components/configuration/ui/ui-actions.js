/* globals FormData */
import Actions from '../../../common/actions'
import AroHttp from '../../../common/aro-http'

function loadConfigurationFromServer () {
  return dispatch => {
    AroHttp.get('/ui_settings')
      .then(result => dispatch({
        type: Actions.CONFIGURATION_SET_CONFIGURATION,
        payload: result.data
      }))
      .catch(err => console.error(err))
  }
}

function getStyleValues () {
  return dispatch => {
    AroHttp.get('/ui_stylesheets', true)
      .then(result => dispatch({
        type: Actions.CONFIGURATION_SET_STYLEVALUES,
        payload: result
      }))
      .catch(err => console.error(err))
  }
}

function setPerspective (perspective) {
  return {
    type: Actions.CONFIGURATION_SET_PERSPECTIVE,
    payload: perspective
  }
}

function saveConfigurationToServerAndReload (type, configuration) {
  return dispatch => {
    AroHttp.post(`/ui_settings/save/${type}`, { configuration: configuration })
      .then(result => dispatch(loadConfigurationFromServer))
      .catch(err => console.error(err))
  }
}

function saveStylesheetsToServerAndReload (Stylesheetvalues) {
  return dispatch => {
    AroHttp.post('/ui_stylesheets', { configuration: Stylesheetvalues })
      .then(result => dispatch(getStyleValues))
      .catch(err => console.error(err))
  }
}

function getAssetKeys (offset, limit) {
  return dispatch => {
    AroHttp.get(`/ui_assets/list/assetKeys?offset=${offset}&limit=${limit}`)
      .then(result => dispatch({
        type: Actions.CONFIGURATION_SET_ASSET_KEYS,
        payload: result.data
      }))
      .catch(err => console.error(err))
  }
}

function uploadAssetToServer (assetKey, file) {
  return dispatch => {
    var formData = new FormData()
    formData.append('file', file)
    AroHttp.postRaw(`/ui_assets/${assetKey}`, formData) // Important to send empty headers so file upload works
      .then(() => dispatch(getAssetKeys(0, 500)))
      .catch(err => console.error(err))
  }
}

function setWormholeFusionConfiguration (wormholeFusionTypes) {
  return {
    type: Actions.CONFIGURATION_SET_WORMHOLE_FUSION_CONFIGURATION,
    payload: wormholeFusionTypes
  }
}

export default {
  loadConfigurationFromServer,
  saveConfigurationToServerAndReload,
  getAssetKeys,
  getStyleValues,
  saveStylesheetsToServerAndReload,
  uploadAssetToServer,
  setPerspective,
  setWormholeFusionConfiguration
}
