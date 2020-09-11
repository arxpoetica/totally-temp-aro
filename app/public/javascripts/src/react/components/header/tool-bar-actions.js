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

export default {
  setPlanInputsModal,
  selectedDisplayMode,
  activeViewModePanel,
  selectedToolBarAction,
  selectedTargetSelectionMode
}