/* globals */
import Actions from '../../../common/actions'
import AroHttp from '../../../common/aro-http'
import RfpStatusTypes from './constants'

function addTargets (targets) {
  return {
    type: Actions.RFP_ADD_TARGETS,
    payload: targets
  }
}

function removeTarget (indexToRemove) {
  return {
    type: Actions.RFP_REMOVE_TARGET,
    payload: indexToRemove
  }
}

function replaceTarget (indexToReplace, target) {
  return {
    type: Actions.RFP_REPLACE_TARGET,
    payload: {
      index: indexToReplace,
      target: target
    }
  }
}

function setSelectedTarget (selectedTarget) {
  return {
    type: Actions.RFP_SET_SELECTED_TARGET,
    payload: selectedTarget
  }
}

function initializeRfpReport (planId, userId, projectId, rfpId, fiberRoutingMode, targets) {
  return dispatch => {
    const requestBody = {
      projectId: projectId,
      rfpId: rfpId,
      fiberRoutingMode: fiberRoutingMode,
      targets: targets.map(target => ({
        id: target.id,
        point: {
          type: 'Point',
          coordinates: [target.lng, target.lat]
        }
      }))
    }
    dispatch({
      type: Actions.RFP_SET_STATUS,
      payload: RfpStatusTypes.RUNNING
    })
    AroHttp.delete(`/service/v1/plan/${planId}/optimization-state?user_id=${userId}`)
      .then(() => AroHttp.post(`/service/rfp/process?user_id=${userId}&plan_id=${planId}`, requestBody))
      .then(result => {
        dispatch({
          type: Actions.RFP_SET_STATUS,
          payload: RfpStatusTypes.FINISHED
        })
      })
      .catch(err => {
        console.error(err)
        dispatch({
          type: Actions.RFP_SET_STATUS,
          payload: RfpStatusTypes.FINISHED
        })
      })
  }
}

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

function modifyRfpReport () {
  return {
    type: Actions.RFP_CLEAR_STATE
  }
}

function setClickMapToAddTarget (clickMapToAddTarget) {
  return {
    type: Actions.RFP_SET_CLICK_MAP_TO_ADD_TARGET,
    payload: clickMapToAddTarget
  }
}

function loadRfpPlans (userId, searchTerm = '') {
  return dispatch => {
    dispatch({
      type: Actions.RFP_SET_IS_LOADING_RFP_PLANS,
      payload: true
    })
    const searchTermWithQuotes = searchTerm ? ` "${searchTerm}"` : ''
    Promise.all([
      AroHttp.get(`/service/v1/plan?search=type:"RFP"${searchTermWithQuotes}&user_id=${userId}`),
      AroHttp.get(`/service/rfp/report-definition?user_id=${userId}`)
    ])
      .then(results => {
        const rfpPlans = results[0].data
        const rfpReportDefinitions = results[1].data.filter(reportDefinition =>
          (reportDefinition.reportData.reportType === 'COVERAGE' || reportDefinition.reportData.reportType === 'RFP')
        )
          .map(reportDefinition => {
            // user_id should come from service. Manually adding it here until service does it.
            reportDefinition.href += '?user_id={userId}'
            return reportDefinition
          })
        dispatch({
          type: Actions.RFP_SET_PLANS,
          payload: {
            rfpPlans: rfpPlans,
            rfpReportDefinitions: rfpReportDefinitions,
            isLoadingRfpPlans: false
          }
        })
      })
      .catch(err => {
        console.error(err)
        dispatch({
          type: Actions.RFP_SET_IS_LOADING_RFP_PLANS,
          payload: false
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

function showOrHideAllRfpStatus (show) {
  return {
    type: Actions.RFP_SHOW_HIDE_ALL_RFP_STATUS,
    payload: show
  }
}

function clearRfpState () {
  return {
    type: Actions.RFP_CLEAR_STATE
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
  addTargets,
  clearRfpState,
  initializeRfpReport,
  submitRfpReport,
  clearRfpPlans,
  loadRfpPlans,
  modifyRfpReport,
  removeTarget,
  replaceTarget,
  setSelectedTarget,
  setClickMapToAddTarget,
  setPlanListOffset,
  showOrHideAllRfpStatus,
  setSelectedTabId,
  loadRfpTemplates,
  addRfpTemplate,
  deleteRfpTemplate,
  setSelectedTemplateId
}
