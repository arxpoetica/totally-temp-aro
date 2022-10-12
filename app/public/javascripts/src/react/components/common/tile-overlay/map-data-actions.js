import { klona } from "klona"
import Actions from "../../../common/actions"
import TileDataMutator from "./tile-data-mutator"
import TileUtils from "./tile-overlay-utils"
import { TileCache, tileCaches } from "./tile-cache"
import { batch } from "react-redux"

// For points there should be a data object that controls badges
// (these badges should be modular and stackable)
// for example 
// UUID: {
//   'TYPE': 'SMALL_BUSINESS',
//   'ALERT': true,
//   'COUNT': 3,
//   'SOMETHING_ELSE': false,
//   'worldCoord': maybe?
// }

// TYPE is a special one all others are optional. 
//  We will have a central register for all of these so that the renderer and tile actions can access them
//  The action creator / controller will choose which ones are applied to which tile data store. 
//  The renderer just renders what values are present on the data object
//  these are part of tile data object so that when a value is changed here; it triggers a rerender just like moving a point
//  We need a generic update data function that invalidates the appropriate tiles in cache:
//    So when ALERT on a single location changes 
//    we get the leaf tile of that ID, 
//    invalidate all the way up the zoom 
//    and then the change in the redux object will trigger a tile refresh
//
//  BUT most of these are derived data so how do we handle that?!

// TileDataMutator takes care of clearing the cache when points are added and removed

// TODO?: should we make near net a dictionary as well with just one entry?

function _addPoints (tileCache, entities) {
  // this function completely clears the current entry for data and cache
  let tileData = TileDataMutator.getNewTileData()
  tileCache.clear()
  let points = {}
  for (const [id, entity] of Object.entries(entities)) {
    // maybe caller should be aware of "location"ness 
    points[id] = TileUtils.latLngToWorldCoord(
      new google.maps.LatLng(entity.point.latitude, entity.point.longitude)
    )
  }
  tileData = TileDataMutator.addPoints(tileData, tileCache, points)
  return {tileData, tileCache}
}

function setTileData (entities, dataIndex, id) {
  return (dispatch) => {
    let tileCache = tileCaches[dataIndex]
    if ('undefined' !== typeof id) { // some tile caches are a dictionary, some are not
      if (!tileCache[id]) {
        tileCache[id] = new TileCache()
      }
      tileCache = tileCache[id]
    }
    let tileSet = _addPoints(tileCache, entities)
    return dispatch({
      type: Actions.MAP_DATA_SET_TILE_DATA, 
      payload: {
        tileData: tileSet.tileData,
        dataIndex,
        id,
      }
    })
  }
}

function batchSetTileData (entitiesById, dataIndex) {
  return (dispatch) => {
    return batch(() => {
      for (const [id, entities] of Object.entries(entitiesById)) {
        dispatch(setTileData(entities, dataIndex, id))
      }
    })
  }
}

function setNearnetTileData (entities) {
  return (dispatch) => {
    return dispatch(setTileData(entities, 'nearnet'))
  }
}

function setSubnetTileData (entities, id) {
  return (dispatch) => {
    return dispatch(setTileData(entities, 'subnets', id))
  }
}

function batchSetSubnetTileData (entitiesById) {
  return (dispatch) => {
    return dispatch(batchSetTileData(entitiesById, 'subnets'))
  }
}

// FUTURE: 'unbounded'

// --- //

function clearTileData (dataIndex) {
  return (dispatch, getState) => {
    const tileData = getState().mapData.tileData[dataIndex] // getState().subnetTileData
    // TODO: FIX; how do we check if a data store is a single or a dictionary?
    // clear tile cache
    if ('nearnet' === dataIndex) {
      tileCaches[dataIndex].clear()
    } else {
      Object.keys(tileData).forEach(subnetId => {
        tileCaches[dataIndex][subnetId].clear()
      })
    }
    // clear data
    return dispatch({
      type: Actions.MAP_DATA_CLEAR_TILE_DATA, 
      payload: {
        dataIndex
      }
    })
  }
}

function clearAllSubnetTileData () {
  return (dispatch) => {
    return dispatch(clearTileData('subnets'))
  }
}

function clearNearnetTileData () {
  return (dispatch) => {
    return dispatch(clearTileData('nearnet'))
  }
}

// --- //

export default {
  setTileData,
  batchSetTileData,
  setNearnetTileData,
  setSubnetTileData,
  batchSetSubnetTileData,
  clearTileData,
  clearAllSubnetTileData,
  clearNearnetTileData,
}
