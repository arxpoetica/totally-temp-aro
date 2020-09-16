import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'

function setPlanInputsModal (status){
  return dispatch => {
    dispatch({
      type: Actions.TOOL_BAR_SET_SAVE_PLAN_AS,
      payload: status
    })
  }
}

function selectedDisplayMode (value){
  return dispatch => {
    dispatch({
      type: Actions.TOOL_BAR_SET_SELECTED_DISPLAY_MODE,
      payload: value
    })
  }
}

function activeViewModePanel (value){
  return dispatch => {
    dispatch({
      type: Actions.TOOL_BAR_SET_ACTIVE_VIEW_MODE_PANEL,
      payload: value
    })
  }
}

function selectedToolBarAction (value){
  return dispatch => {
    dispatch({
      type: Actions.TOOL_BAR_SELECTED_TOOL_BAR_ACTION,
      payload: value
    })
  }
}

function selectedTargetSelectionMode (value){
  return dispatch => {
    dispatch({
      type: Actions.TOOL_BAR_SELECTED_TARGET_SELECTION_MODE,
      payload: value
    })
  }
}

function setIsRulerEnabled (value){
  return dispatch => {
    dispatch({
      type: Actions.TOOL_BAR_IS_RULER_ENABLED,
      payload: value
    })
  }
}

function getOptimizationBody(optimizationInputs, activeSelectionModeId, locationLayers, plan) {
  return dispatch => {
    var inputs = JSON.parse(JSON.stringify(optimizationInputs))
    // inputs.analysis_type = service.networkAnalysisTypeId
    // inputs.planId = service.planId
    inputs.planId = plan.id
    inputs.locationConstraints = {}
    inputs.locationConstraints.analysisSelectionMode = activeSelectionModeId
    inputs.locationConstraints.locationTypes = []
    locationLayers.forEach(locationsLayer => {
      if (locationsLayer.checked) inputs.locationConstraints.locationTypes.push(locationsLayer.plannerKey)
    })
    return inputs
  }
}

export default {
  setPlanInputsModal,
  selectedDisplayMode,
  activeViewModePanel,
  selectedToolBarAction,
  selectedTargetSelectionMode,
  setIsRulerEnabled,
  getOptimizationBody
}