// general purpose lodash-like utilities

// 1. lodash's _.set function in vanilla js:
export function set (obj, path, value) {
    const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g)
    
    pathArray.reduce((acc, key, i) => {
        if (acc[key] === undefined) acc[key] = {}
        if (i === pathArray.length - 1) acc[key] = value
        return acc[key]
    }, obj)
}

export function updateDrawingManagerState (drawingManager, selectedDisplayMode, targetSelectionMode, state, displayModes, mapRef) {
    if (!drawingManager) {
      return
    }

    if (selectedDisplayMode === displayModes.VIEW 
      && targetSelectionMode === state.targetSelectionModes.POLYGON_EXPORT_TARGET
      || (
        (selectedDisplayMode === displayModes.ANALYSIS || selectedDisplayMode === displayModes.VIEW) 
        && targetSelectionMode === state.targetSelectionModes.POLYGON_PLAN_TARGET)
      ) {
      drawingManager.setDrawingMode('polygon')
      drawingManager.setMap(mapRef)
    } else {
      drawingManager.setDrawingMode('marker')
      drawingManager.setMap(null)
    }
  }