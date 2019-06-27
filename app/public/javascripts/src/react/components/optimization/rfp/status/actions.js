/* globals */
import Actions from '../../../../common/actions'
import AroHttp from '../../../../common/aro-http'

function submitRfpReport (userId, requestBody) {
  return dispatch => {
    AroHttp.post(`/service/rfp/process?user_id=${userId}`, requestBody)
      .then(result => {
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
  setPlanListOffset,
  setSelectedTabId,
  loadRfpTemplates,
  addRfpTemplate,
  deleteRfpTemplate,
  setSelectedTemplateId
}
