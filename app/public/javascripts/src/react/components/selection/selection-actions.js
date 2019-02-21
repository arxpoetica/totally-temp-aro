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
        const planTargets = new Set([...results[0].data, ...results[1].data, ...results[2].data])
        dispatch({ type: Actions.SELECTION_ADD_PLAN_TARGETS, payload: planTargets })
      })
      .catch(err => console.error(err))
  }
}

export default {
  setActiveSelectionMode: setActiveSelectionMode,
  loadPlanTargetSelectionsFromServer: loadPlanTargetSelectionsFromServer
}
