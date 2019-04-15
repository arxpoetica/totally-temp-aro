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

function getReportsMetadata () {
  return dispatch => {
    AroHttp.get('/service/v2/installed/report/meta-data')
      .then(result => dispatch({
        type: Actions.CONFIGURATION_SET_REPORTS_METADATA,
        payload: result.data
      }))
      .catch(err => console.error(err))
  }
}

function startEditingReport (reportId) {
  return {
    type: Actions.CONFIGURATION_SET_EDITING_REPORT_ID,
    payload: reportId
  }
}

function populateEditingReportDefinition (reportId) {
  return dispatch => {
    AroHttp.get(`/service/v2/report-module/${reportId}`)
      .then(result => dispatch({
        type: Actions.CONFIGURATION_SET_EDITING_REPORT_DEFINITION,
        payload: result.data
      }))
      .catch(err => console.error(err))
  }
}

export default {
  loadConfigurationFromServer: loadConfigurationFromServer,
  saveConfigurationToServerAndReload: saveConfigurationToServerAndReload,
  getAssetKeys: getAssetKeys,
  uploadAssetToServer: uploadAssetToServer,
  getReportsMetadata: getReportsMetadata,
  startEditingReport: startEditingReport,
  populateEditingReportDefinition: populateEditingReportDefinition
}
