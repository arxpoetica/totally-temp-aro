/* globals FormData */
import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'

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

function clearEditingReportDefinition () {
  return {
    type: Actions.CONFIGURATION_SET_EDITING_REPORT_DEFINITION,
    payload: null
  }
}

function saveEditingReportPrimaryDefinition (primaryDefinition) {
  return {
    type: Actions.CONFIGURATION_SET_EDITING_REPORT_PRIMARY_DEFINITION,
    payload: primaryDefinition
  }
}

function saveEditingReportSubDefinition (subDefinition, subDefinitionIndex) {
  return {
    type: Actions.CONFIGURATION_SET_EDITING_REPORT_SUBDEFINITION,
    payload: {
      subDefinition: subDefinition,
      subDefinitionIndex: subDefinitionIndex
    }
  }
}

function saveCurrentReportToServer () {
  return (dispatch, getState) => {
    // We have to do a getState() because there may be state changes that have not yet been updated in the calling component
    const reportDefinition = getState().configuration.reports.reportBeingEdited
    return AroHttp.put(`/service/v2/report-module/${reportDefinition.id}`, reportDefinition)
      .then(() => dispatch({
        type: Actions.CONFIGURATION_CLEAR_EDITING_REPORT
      }))
      .catch(err => console.error(err))
  }
}

function deleteReport (reportId) {
  return dispatch => {
    AroHttp.delete(`/service/v2/report-module/${reportId}`)
      .then(() => dispatch(getReportsMetadata()))
      .catch(err => console.error(err))
  }
}

function validateReport (planId) {
  return (dispatch, getState) => {
    // We have to do a getState() because there may be state changes that have not yet been updated in the calling component
    const reportDefinition = getState().configuration.reports.reportBeingEdited
    return AroHttp.post(`/service/v2/report-module-validate/${planId}?sampleSize=10`, reportDefinition)
      .then(result => dispatch({
        type: Actions.CONFIGURATION_SET_REPORT_VALIDATION,
        payload: result.data
      }))
      .catch(err => {
        console.error(err)
        dispatch({
          type: Actions.CONFIGURATION_SET_REPORT_VALIDATION,
          payload: err
        })
      })
  }
}

export default {
  loadConfigurationFromServer: loadConfigurationFromServer,
  saveConfigurationToServerAndReload: saveConfigurationToServerAndReload,
  getAssetKeys: getAssetKeys,
  uploadAssetToServer: uploadAssetToServer,
  getReportsMetadata: getReportsMetadata,
  startEditingReport: startEditingReport,
  populateEditingReportDefinition: populateEditingReportDefinition,
  clearEditingReportDefinition: clearEditingReportDefinition,
  saveEditingReportPrimaryDefinition: saveEditingReportPrimaryDefinition,
  saveEditingReportSubDefinition: saveEditingReportSubDefinition,
  saveCurrentReportToServer: saveCurrentReportToServer,
  deleteReport: deleteReport,
  validateReport: validateReport
}
