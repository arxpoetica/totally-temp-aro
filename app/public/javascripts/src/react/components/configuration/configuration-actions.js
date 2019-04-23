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

function saveEditingReportType (reportType) {
  return {
    type: Actions.CONFIGURATION_SET_EDITING_REPORT_TYPE,
    payload: reportType
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

function addEditingReportSubDefinition () {
  return {
    type: Actions.CONFIGURATION_ADD_EDITING_REPORT_SUBDEFINITION
  }
}

function removeEditingReportSubDefinition (subDefinitionIndex) {
  return {
    type: Actions.CONFIGURATION_REMOVE_EDITING_REPORT_SUBDEFINITION,
    payload: subDefinitionIndex
  }
}

function saveCurrentReportToServer () {
  return (dispatch, getState) => {
    // We have to do a getState() because there may be state changes that have not yet been updated in the calling component
    const reportDefinition = getState().configuration.reports.reportBeingEdited
    return AroHttp.put(`/service/v2/report-module/${reportDefinition.id}`, reportDefinition)
      .then(() => {
        dispatch(getReportsMetadata()) // The name/reporttype may have changed
        dispatch(clearEditingReportDefinition())
      })
      .catch(err => console.error(err))
  }
}

function createReport () {
  return dispatch => {
    const blankReport = {
      reportType: 'GENERAL',
      moduleDefinition: {
        definition: {
          name: 'new_report',
          displayName: 'New Report',
          queryType: 'SQL_REPORT',
          query: "SELECT 'Test Report';"
        },
        subDefinitions: []
      }
    }
    AroHttp.post(`/service/v2/report-module/-1`, blankReport)
      .then(result => {
        dispatch(startEditingReport(result.data.id))
        dispatch(getReportsMetadata()) // List has changed. Update it.
      })
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
  saveEditingReportType: saveEditingReportType,
  saveEditingReportSubDefinition: saveEditingReportSubDefinition,
  addEditingReportSubDefinition: addEditingReportSubDefinition,
  removeEditingReportSubDefinition: removeEditingReportSubDefinition,
  saveCurrentReportToServer: saveCurrentReportToServer,
  createReport: createReport,
  deleteReport: deleteReport,
  validateReport: validateReport
}
