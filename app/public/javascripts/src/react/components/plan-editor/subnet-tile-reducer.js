import Actions from '../../common/actions'
import { klona } from 'klona'
import mapDataIndices from '../common/tile-overlay/tile-cache'

//const defaultState = klona(mapDataIndices)

const defaultState = {
  // subnetIds: tile data object
}

function updateSubnetTileData (state, subnetId, tileData) {
  return { ...state, 
    [subnetId]: tileData,
  }
}

// --- //
function subnetTileReducer (state = defaultState, {type, payload}) {
  switch (type) {
    case Actions.SUBNET_TILES_UPDATE_DATA:
      return updateSubnetTileData(state, payload.subnetId, payload.tileData)

    case Actions.SUBNET_TILES_CLEAR_DATA:
      return defaultState

    default:
      return state
  }
}

export default subnetTileReducer
