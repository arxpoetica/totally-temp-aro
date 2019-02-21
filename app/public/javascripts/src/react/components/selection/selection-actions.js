import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'

function setActiveSelectionMode (selectionModeId) {
  return {
    type: Actions.SELECTION_SET_ACTIVE_MODE,
    payload: selectionModeId
  }
}

function loadPlanTargetSelectionsFromServer (planId) {
  return dispatch => {
    // First clear all selections
    dispatch({ type: Actions.SELECTION_CLEAR_ALL_PLAN_TARGETS })

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
      AroHttp.post(`/network_plan/${planId}/addServiceAreaTargets`, { serviceAreaIds: Array.from(planTargets.serviceAreas) })
        .catch(err => console.error(err))
    }
    if (planTargets.analysisAreas) {
      AroHttp.post(`/network_plan/${planId}/addAnalysisAreaTargets`, { analysisAreaIds: Array.from(planTargets.analysisAreas) })
        .catch(err => console.error(err))
    }
  }
}

function addLocationPlanTargets (planId, locationIds) {
  return addPlanTargets(planId, { locations: locationIds })
}

function addServiceAreaPlanTargets (planId, serviceAreaIds) {
  return addPlanTargets(planId, { serviceAreas: serviceAreaIds })
}

function addAnalysisAreaPlanTargets (planId, analysisAreaIds) {
  return addPlanTargets(planId, { analysisAreas: analysisAreaIds })
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
      AroHttp.post(`/network_plan/${planId}/removeServiceAreaTargets`, { serviceAreaIds: Array.from(planTargets.serviceAreas) })
        .catch(err => console.error(err))
    }
    if (planTargets.analysisAreas) {
      AroHttp.post(`/network_plan/${planId}/removeAnalysisAreaTargets`, { analysisAreaIds: Array.from(planTargets.analysisAreas) })
        .catch(err => console.error(err))
    }
  }
}

function removeLocationPlanTargets (planId, locationIds) {
  return removePlanTargets(planId, { locations: locationIds })
}

function removeServiceAreaPlanTargets (planId, serviceAreaIds) {
  return removePlanTargets(planId, { serviceAreas: serviceAreaIds })
}

function removeAnalysisAreaPlanTargets (planId, analysisAreaIds) {
  return removePlanTargets(planId, { analysisAreas: analysisAreaIds })
}

export default {
  setActiveSelectionMode: setActiveSelectionMode,
  loadPlanTargetSelectionsFromServer: loadPlanTargetSelectionsFromServer,
  addLocationPlanTargets: addLocationPlanTargets,
  addServiceAreaPlanTargets: addServiceAreaPlanTargets,
  addAnalysisAreaPlanTargets: addAnalysisAreaPlanTargets,
  removeLocationPlanTargets: removeLocationPlanTargets,
  removeServiceAreaPlanTargets: removeServiceAreaPlanTargets,
  removeAnalysisAreaPlanTargets: removeAnalysisAreaPlanTargets
}
