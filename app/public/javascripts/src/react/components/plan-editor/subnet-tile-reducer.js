import Actions from '../../common/actions'

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

    default:
      return state
  }
}

export default subnetTileReducer
