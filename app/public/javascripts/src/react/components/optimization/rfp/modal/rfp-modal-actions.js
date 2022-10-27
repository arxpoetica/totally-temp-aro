/* globals Blob */
import { saveAs } from 'file-saver'
import { RFP_VERSIONS } from './rfp-modal-shared'
import Actions from '../../../../common/actions'
import AroHttp from '../../../../common/aro-http'
import { Notifier } from '../../../../common/notifications'

function submitRfpReport (rfpVersion, requestBody) {
  return dispatch => {
    dispatch({
      type: Actions.RFP_SET_IS_SUBMITTING_RESULT,
      payload: true
    })
    const url = rfpVersion === RFP_VERSIONS.SERVICE_AREA.value
      ? '/service/v2/rfp/process'
      : `/service/rfp/process`

    AroHttp.post(url, requestBody)
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

function downloadRfpReport (filename, reportUrl) {
  return dispatch => {
    dispatch({
      type: Actions.RFP_START_DOWNLOADING_REPORT,
      payload: reportUrl
    })
    AroHttp.get(`/service${reportUrl}`, true)
      .then(result => {
        var blobToSave = ''
        if (typeof result === 'string') {
          blobToSave = new Blob([result])
        } else {
          // We got back a binary response. Save it.
          blobToSave = new Blob([new Uint8Array(result)])
        }
        saveAs(blobToSave, filename)
        dispatch({
          type: Actions.RFP_END_DOWNLOADING_REPORT,
          payload: reportUrl
        })
      })
      .catch(err => {
        console.error(err)
        dispatch({
          type: Actions.RFP_END_DOWNLOADING_REPORT,
          payload: reportUrl
        })
      })
  }
}

function loadRfpTemplates(initial) {
  return async dispatch => {
    try {
      const { data } = await AroHttp.get('/ui/rfp_templates')
      dispatch({ type: Actions.RFP_SET_TEMPLATES, payload: data })
      if (initial) return data
    } catch (error) {
      Notifier.error(error)
    }
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

export default {
  submitRfpReport,
  downloadRfpReport,
  loadRfpTemplates,
  addRfpTemplate,
  deleteRfpTemplate,
}
