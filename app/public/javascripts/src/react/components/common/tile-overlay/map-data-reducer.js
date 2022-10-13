// possibly split this into 
//  - tile-data-reducer
//  - entity-data-reducer

import Actions from "../../../common/actions"
import { klona } from "klona"
import { mapDataIndices } from "./tile-cache"

// mapDataIndices = {
//   nearnet: {},
//   subnets: {},
//   unbounded: {},
// }

const defaultState = {
  entityData: klona(mapDataIndices), 
  tileData: klona(mapDataIndices),
}
// TODO: given what we found out about how SLOW the spread operator is (the "..."),
//  we should make a generic utility for object merge 
//  then we can optomize that

function setDataSubset (state, dataSet, dataType, dataIndex, id) {
  return { ...state,
    [dataType]: { ...state[dataType],
      [dataIndex]: { ...state[dataType][dataIndex],
        [id]: dataSet
      }
    }
  }
}

function setData (state, dataSet, dataType, dataIndex, id) {
  if ('undefined' === typeof id) { // some data sets will be subdivided by IDs (eg. subnets)
    return { ...state,
      [dataType]: { ...state[dataType],
        [dataIndex]: dataSet
      }
    }
  } else {
    return setDataSubset(state, dataSet, dataType, dataIndex, id)
  }
}

function clearDataSubset (state, dataType, dataIndex, id) {
  let dataSet = klona(state[dataType][dataIndex])
  delete dataSet[id]
  return { ...state,
    [dataType]: { ...state[dataType],
      [dataIndex]: dataSet
    }
  }
}

function clearData (state, dataType, dataIndex, id) {
  // some data sets will be subdivided by IDs (eg. subnets)
  //  also useful if you want to clear ALL subnets (for eg.)
  if ('undefined' === typeof id) {
    return { ...state,
      [dataType]: { ...state[dataType],
        [dataIndex]: {}
      }
    }
  } else {
    return clearDataSubset(state, dataType, dataIndex, id)
  }
}

// --- //

function mapData (state = defaultState, {type, payload}) {
  let id = undefined
  switch (type) {
    // --- set --- //
    case Actions.MAP_DATA_SET_DATA:
      if ('id' in payload) id = payload.id
      return setData(state, payload.data, payload.dataType, payload.dataIndex, id)


    case Actions.MAP_DATA_SET_TILE_DATA:
      if ('id' in payload) id = payload.id
      return setData(state, payload.tileData, 'tileData', payload.dataIndex, id)

    case Actions.MAP_DATA_SET_ENTITY_DATA:
      if ('id' in payload) id = payload.id
      return setData(state, payload.entityData, 'entityData', payload.dataIndex, id)


    // case Actions.MAP_DATA_SET_SUBNET_TILE_DATA:
    //   return setData(state, payload.tileData, 'tileData', 'subnets', id)

    // case Actions.MAP_DATA_SET_NEARNET_TILE_DATA:
    //   return setData(state, payload.tileData, 'tileData', 'nearnet')

    // case Actions.MAP_DATA_SET_UNBOUNDED_TILE_DATA:
    //   return setData(state, payload.tileData, 'tileData', 'unbounded', id) // future


    // case Actions.MAP_DATA_SET_SUBNET_ENTITY_DATA:
    //   return setData(state, payload.entityData, 'entityData', 'subnets', id) // future?

    // case Actions.MAP_DATA_SET_NEARNET_ENTITY_DATA:
    //   return setData(state, payload.entityData, 'entityData', 'nearnet')

    // case Actions.MAP_DATA_SET_UNBOUNDED_ENTITY_DATA:
    //   return setData(state, payload.entityData, 'entityData', 'unbounded', id) // future
  
    // --- clear --- //
    
    case Actions.MAP_DATA_CLEAR_DATA:
      if ('id' in payload) id = payload.id
      return clearData(state, payload.dataType, payload.dataIndex, id)


    case Actions.MAP_DATA_CLEAR_TILE_DATA:
      if ('id' in payload) id = payload.id
      return clearData(state, 'tileData', payload.dataIndex, id)

    case Actions.MAP_DATA_CLEAR_ENTITY_DATA:
      if ('id' in payload) id = payload.id
      return clearData(state, 'entityData', payload.dataIndex, id)


    // case Actions.MAP_DATA_CLEAR_SUBNET_TILE_DATA:
    //   return clearData(state, 'tileData', 'subnets', id)

    // case Actions.MAP_DATA_CLEAR_NEARNET_TILE_DATA:
    //   return clearData(state, 'tileData', 'nearnet')

    // case Actions.MAP_DATA_CLEAR_UNBOUNDED_TILE_DATA:
    //   return clearData(state, 'tileData', 'unbounded', id) // future


    // case Actions.MAP_DATA_CLEAR_SUBNET_ENTITY_DATA:
    //   return clearData(state, 'entityData', 'subnets', id) // future?

    // case Actions.MAP_DATA_CLEAR_NEARNET_ENTITY_DATA:
    //   return clearData(state, 'entityData', 'nearnet')

    // case Actions.MAP_DATA_CLEAR_UNBOUNDED_ENTITY_DATA:
    //   return clearData(state, 'entityData', 'unbounded', id) // future


    default:
      return state
  }
}

export default mapData
