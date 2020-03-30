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
    dispatch(clearAllPlanTargets())

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
          analysisAreas: results[2].data.map(item => +item.id),
          allServiceAreas: []
        }
        dispatch(addPlanTargets(planId, planTargets))
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
    // Get descriptions for added plan targets, then save them to the client state
    var descriptionPromises = [
      AroHttp.post('/network_plan/targets/addresses', { locationIds: [...(planTargets.locations || [])] }),
      AroHttp.post('/network_plan/service_area/addresses', { serviceAreaIds: [...(planTargets.serviceAreas || [])] }),
      AroHttp.post('/network_plan/analysis_area/addresses', { analysisAreaIds: [...(planTargets.analysisAreas || [])] })
    ]
    Promise.all(descriptionPromises)
      .then(results => {
        dispatch({
          type: Actions.SELECTION_ADD_PLAN_TARGET_DESCRIPTIONS,
          payload: {
            locations: results[0].data,
            serviceAreas: results[1].data,
            analysisAreas: results[2].data,
            allServiceAreas: []
          }
        })
        // ToDo: turn on boundary layers for any new description that has an entry in planTargets
      })
      .catch(err => console.error(err))
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

function setLocations (locationIds) {
  return {
    type: Actions.SELECTION_SET_LOCATIONS,
    payload: locationIds
  }
}

function setPlanEditorFeatures (planEditorFeatures) {
  return {
    type: Actions.SELECTION_SET_PLAN_EDITOR_FEATURES,
    payload: planEditorFeatures
  }
}

export default {
  setActiveSelectionMode,
  clearAllPlanTargets,
  loadPlanTargetSelectionsFromServer,
  addPlanTargets,
  removePlanTargets,
  setLocations,
  setPlanEditorFeatures
}
