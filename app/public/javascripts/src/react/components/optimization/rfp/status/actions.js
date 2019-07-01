/* globals Blob */
import { saveAs } from 'file-saver'
import Actions from '../../../../common/actions'
import AroHttp from '../../../../common/aro-http'

function submitRfpReport (userId, requestBody) {
  return dispatch => {
    dispatch({
      type: Actions.RFP_SET_IS_SUBMITTING_RESULT,
      payload: true
    })
    AroHttp.post(`/service/rfp/process`, requestBody)
      .then(result => {
        dispatch({
          type: Actions.RFP_SET_IS_SUBMITTING_RESULT,
          payload: false
        })
        dispatch({
          type: Actions.RFP_SET_SUBMIT_RESULT,
          payload: {
            type: 'success',
            message: 'The RFP was submitted successfully to the server'
          }
        })
      })
      .catch(err => {
        console.error(err)
        dispatch({
          type: Actions.RFP_SET_IS_SUBMITTING_RESULT,
          payload: false
        })
        dispatch({
          type: Actions.RFP_SET_SUBMIT_RESULT,
          payload: {
            type: 'error',
            message: `Error when submitting the RFP.\n ${err.message}`
          }
        })
      })
  }
}

function clearRfpPlans () {
  return {
    type: Actions.RFP_SET_PLANS,
    payload: {
      rfpPlans: [],
      isLoadingRfpPlans: false
    }
  }
}

function downloadRfpReport (filename, reportUrl) {
  return dispatch => {
    dispatch({
      type: Actions.RFP_START_DOWNLOADING_REPORT,
      payload: reportUrl
    })
    AroHttp.get(`/service-download-file/undefined.txt/${reportUrl}`)
      .then(result => {
        // All this type checking is really a workaround. We need to fix formats (and aro-http.js) correctly
        var blobToSave = null
        if (result.data.type === 'Buffer') {
          blobToSave = new Blob([new Uint8Array(result.data.data)]) // For binary files like xls
        } else if (typeof result.data === 'string') {
          blobToSave = new Blob([result.data]) // For text files like csv
        } else {
          blobToSave = new Blob([JSON.stringify(result.data, null, 2)]) // For objects to be saved as json
        }
        saveAs(blobToSave, filename)
        dispatch({
          type: Actions.RFP_END_DOWNLOADING_REPORT,
          payload: reportUrl
        })
      })
      .catch(err => {
        console.log(err)
        dispatch({
          type: Actions.RFP_END_DOWNLOADING_REPORT,
          payload: reportUrl
        })
      })
  }
}

function setPlanListOffset (planListOffset) {
  return {
    type: Actions.RFP_SET_PLAN_LIST_OFFSET,
    payload: planListOffset
  }
}

function setSelectedTabId (selectedTabId) {
  return {
    type: Actions.RFP_SET_SELECTED_TAB_ID,
    payload: selectedTabId
  }
}

function loadRfpTemplates () {
  return dispatch => {
    AroHttp.get('/ui/rfp_templates')
      .then(result => dispatch({
        type: Actions.RFP_SET_TEMPLATES,
        payload: result.data
      }))
      .catch(err => console.error(err))
  }
}

function addRfpTemplate (name, template) {
  return dispatch => {
    const requestBody = {
      name: name,
      value: template
    }
    AroHttp.post('/ui/rfp_template', requestBody)
      .then(result => dispatch(loadRfpTemplates()))
      .catch(err => console.error(err))
  }
}

function deleteRfpTemplate (templateId) {
  return dispatch => {
    AroHttp.delete(`/ui/rfp_template/${templateId}`)
      .then(result => dispatch(loadRfpTemplates()))
      .catch(err => console.error(err))
  }
}

function setSelectedTemplateId (selectedTemplateId) {
  return {
    type: Actions.RFP_SET_SELECTED_TEMPLATE_ID,
    payload: selectedTemplateId
  }
}

export default {
  submitRfpReport,
  clearRfpPlans,
  downloadRfpReport,
  setPlanListOffset,
  setSelectedTabId,
  loadRfpTemplates,
  addRfpTemplate,
  deleteRfpTemplate,
  setSelectedTemplateId
}
