import Actions from '../../common/actions'

const defaultState = {
  layers: {},
  isDownloading: false
}

function setLayers (state, layerNames) {
  var layersObj = {}
  layerNames.forEach(layerName => { layersObj[layerName] = { isChecked: false } })
  return { ...state,
    layers: layersObj
  }
}

function setLayerIsChecked (state, layerName, isChecked) {
  return { ...state,
    layers: { ...state.layers,
      [layerName]: { ...state.layers[layerName],
        isChecked: isChecked
      }
    }
  }
}

function clearMapReports () {
  return JSON.parse(JSON.stringify(defaultState))
}

function mapReportsReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.MAP_REPORTS_SET_LAYERS:
      return setLayers(state, action.payload)

    case Actions.MAP_REPORTS_SET_LAYER_IS_CHECKED:
      return setLayerIsChecked(state, action.payload.layerName, action.payload.isChecked)

    case Actions.MAP_REPORTS_CLEAR:
      return clearMapReports()

    default:
      return state
  }
}

export default mapReportsReducer
