import Actions from '../../common/actions'

function setToolboxVisibility (showToolbox) {
  return {
    type: Actions.TOOL_SET_TOOLBOX_VISIBILITY,
    payload: showToolbox
  }
}

function setActiveTool (activeTool) {
  return {
    type: Actions.TOOL_SET_ACTIVE_TOOL,
    payload: activeTool
  }
}

export default {
  setToolboxVisibility,
  setActiveTool
}
