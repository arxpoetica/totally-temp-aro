/* globals */
import Actions from '../../../common/actions'
import AroHttp from '../../../common/aro-http'
import RfpStatusTypes from './constants'
import PlanActions from '../../plan/plan-actions'

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

function initializeRfpReport (planId, userId, projectId, rfpId, fiberRoutingMode, targets, dataItems, resourceItems) {
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
    AroHttp.delete(`/service/v1/plan/${planId}/optimization-state`)
      .then(() => AroHttp.post(`/service/rfp/process?user_id=${userId}`, requestBody))
      .then(result => {
        AroHttp.get(`/service/v1/plan?search=type:"RFP"&user_id=${userId}`)
          .then(rfpPlans => {
            if (rfpPlans) {
              rfpPlans.data.sort((a, b) => b.id - a.id)
              const activePlan = rfpPlans.data.find(plan => plan.id === result.data.planId)
              dispatch(PlanActions.savePlanConfiguration(activePlan, dataItems, resourceItems))
            }
          })
      })
      .then(() => dispatch(loadRfpPlans(userId, '', true)))
      .then(() => {
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

function loadRfpPlans (userId, searchTerm = '', runRfpPlan) {
  return dispatch => {
    dispatch({
      type: Actions.RFP_SET_IS_LOADING_RFP_PLANS,
      payload: true
    })
    const searchTermWithQuotes = searchTerm ? ` "${searchTerm}"` : ''
    let rfpPlans = []
    Promise.all([
      AroHttp.get(`/service/v1/plan?search=type:"RFP"${searchTermWithQuotes}&user_id=${userId}`),
      AroHttp.get(`/service/rfp/report-definition`)
    ])
      .then(results => {
        rfpPlans = results[0].data
        rfpPlans.sort((a, b) => a.id > b.id ? -1 : 1) // Sort plans in descending order by ID (so newest plans appear first)

        const rfpReportDefinitions = results[1].data.length 
        ? results[1].data.filter(reportDefinition =>
          (reportDefinition.reportData.reportType === 'COVERAGE'
          || reportDefinition.reportData.reportType === 'RFP')
        )
        : []

        dispatch({
          type: Actions.RFP_SET_PLANS,
          payload: {
            rfpPlans: rfpPlans,
            rfpReportDefinitions: rfpReportDefinitions,
            isLoadingRfpPlans: false
          }
        })
      })
      .then(() => {
        if (runRfpPlan && rfpPlans.length) dispatch(PlanActions.loadPlan(rfpPlans[0].id))
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

function clearRfpState () {
  return {
    type: Actions.RFP_CLEAR_STATE
  }
}

function showOrHideAllRfpStatus (show) {
  return {
    type: Actions.RFP_SHOW_HIDE_ALL_RFP_STATUS,
    payload: show
  }
}

function setOptimizationProgress (percent) {
  return {
    type: Actions.RFP_SET_OPTIMIZATION_PROGRESS_PERCENT,
    payload: percent
  }
}

function showOrHideFullScreenContainer (showFullScreenContainer) {
  return {
    type: Actions.RFP_FULL_SCREEN_SHOW_HIDE_CONTAINER,
    payload: showFullScreenContainer
  }
}

export default {
  addTargets,
  clearRfpState,
  initializeRfpReport,
  clearRfpPlans,
  loadRfpPlans,
  modifyRfpReport,
  removeTarget,
  replaceTarget,
  setSelectedTarget,
  setClickMapToAddTarget,
  showOrHideAllRfpStatus,
  setOptimizationProgress,
  showOrHideFullScreenContainer,
}
