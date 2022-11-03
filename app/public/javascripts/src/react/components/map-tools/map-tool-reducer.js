import { MapToolActions } from './map-display-tools.jsx'

function setMapTools(state, updatedState) {
  return {
    ...updatedState,
    tools: {
      ...updatedState.tools,
      available_tools: state.tools.available_tools,
    },
  }
}

function setShowMapTool(state, toolName) {
  //only one map_tool can be visible at a time
  if (state.visible.length > 0) {
    state.visible = []
  }
  state.visible.push(toolName)
  return { ...state } 
}

function setHideMapTool(state, toolName) {
  const toolIndex = state.visible.indexOf(toolName)
  if (toolIndex !== -1) {
    state.visible.splice(toolIndex, 1)
  }
  return { ...state } 
}

function setToggleMapTool(state, toolName) {
  state.visible.some((tool) => tool === toolName)
    ? setHideMapTool(state, toolName)
    : setShowMapTool(state, toolName)
  return { ...state } 
}

function setExpandMapTool(state, toolName) {
  delete state.collapsed[toolName]
  return { ...state } 
}

function setCollapseMapTool(state, toolName) {
  state.collapsed[toolName] = true
  return { ...state } 
}

export function mapToolReducer(state, action){
  const { type , payload } = action

  switch(type){
    case MapToolActions.MAP_SET_MAP_TOOLS:
      return setMapTools(state, payload)

    case MapToolActions.MAP_SET_SHOW_MAP_TOOL:
      return setShowMapTool(state, payload)

    case MapToolActions.MAP_SET_HIDE_MAP_TOOL:
      return setHideMapTool(state, payload)

    case MapToolActions.MAP_SET_TOGGLE_MAP_TOOL:
      return setToggleMapTool(state, payload)

    case MapToolActions.MAP_SET_EXPAND_MAP_TOOL:
      return setExpandMapTool(state, payload)

    case MapToolActions.MAP_SET_COLLAPSE_MAP_TOOL:
      return setCollapseMapTool(state, payload)
  }
}
