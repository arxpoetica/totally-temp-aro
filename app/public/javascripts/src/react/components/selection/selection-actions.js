import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'

function setActiveSelectionMode (selectionModeId) {
  return {
    type: Actions.SELECTION_SET_ACTIVE_MODE,
    payload: selectionModeId
  }
}

function clearAllPlanTargets () {
  return { type: Actions.SELECTION_CLEAR_ALL_PLAN_TARGETS }
}

function loadPlanTargetSelectionsFromServer (planId) {
  return dispatch => {
    // First clear all selections
    dispatch(clearAllPlanTargets)

    // Then get selections from the server
    var selectionPromises = [
      AroHttp.get(`/locations/${planId}/selectedLocationIds`),
      AroHttp.get(`/service_areas/${planId}/selectedServiceAreaIds`),
      AroHttp.get(`/analysis_areas/${planId}/selectedAnalysisAreaIds`)
    ]

    Promise.all(selectionPromises)
      .then(results => {
        const planTargets = {
          locations: results[0].data.map(item => +item.id),
          serviceAreas: results[1].data.map(item => +item.id),
          analysisAreas: results[2].data.map(item => +item.id)
        }
        dispatch({ type: Actions.SELECTION_ADD_PLAN_TARGETS, payload: planTargets })
      })
      .catch(err => console.error(err))
  }
}

function addPlanTargets (planId, planTargets) {
  return dispatch => {
    // Update client state
    dispatch({ type: Actions.SELECTION_ADD_PLAN_TARGETS, payload: planTargets })
    // Save targets on server
    if (planTargets.locations) {
      AroHttp.post(`/network_plan/${planId}/addTargets`, { locationIds: Array.from(planTargets.locations) })
        .catch(err => console.error(err))
    }
    if (planTargets.serviceAreas) {
      AroHttp.post(`/service_areas/${planId}/addServiceAreaTargets`, { serviceAreaIds: Array.from(planTargets.serviceAreas) })
        .catch(err => console.error(err))
    }
    if (planTargets.analysisAreas) {
      AroHttp.post(`/analysis_areas/${planId}/addAnalysisAreaTargets`, { analysisAreaIds: Array.from(planTargets.analysisAreas) })
        .catch(err => console.error(err))
    }
  }
}

function removePlanTargets (planId, planTargets) {
  return dispatch => {
    // Update client state
    dispatch({ type: Actions.SELECTION_REMOVE_PLAN_TARGETS, payload: planTargets })
    // Save targets on server
    if (planTargets.locations) {
      AroHttp.post(`/network_plan/${planId}/removeTargets`, { locationIds: Array.from(planTargets.locations) })
        .catch(err => console.error(err))
    }
    if (planTargets.serviceAreas) {
      AroHttp.post(`/service_areas/${planId}/removeServiceAreaTargets`, { serviceAreaIds: Array.from(planTargets.serviceAreas) })
        .catch(err => console.error(err))
    }
    if (planTargets.analysisAreas) {
      AroHttp.post(`/analysis_areas/${planId}/removeAnalysisAreaTargets`, { analysisAreaIds: Array.from(planTargets.analysisAreas) })
        .catch(err => console.error(err))
    }
  }
}

export default {
  setActiveSelectionMode: setActiveSelectionMode,
  clearAllPlanTargets: clearAllPlanTargets,
  loadPlanTargetSelectionsFromServer: loadPlanTargetSelectionsFromServer,
  addPlanTargets: addPlanTargets,
  removePlanTargets: removePlanTargets
}
