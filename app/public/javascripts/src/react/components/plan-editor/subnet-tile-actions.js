import { klona } from 'klona'
import Actions from "../../common/actions"
import TileDataMutator from "../common/tile-overlay/tile-data-mutator"
import { TileCache } from "../common/tile-overlay/tile-cache"
import TileUtils from '../common/tile-overlay/tile-overlay-utils'
import { batch } from 'react-redux'
// global: tileCache.subnets

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



function setSubnetData (subnetId, locations) { // will make this generic in te future
  //console.log(global)
  //let tileCache = global.tileCache
  if (!tileCache.subnets[subnetId]) {
    tileCache.subnets[subnetId] = new TileCache()
  }
  return (dispatch) => {
    // this function completely clears the current entry for data and cache
    let tileData = TileDataMutator.getNewTileData()
    tileCache.subnets[subnetId].clear()
    let points = {}
    for (const [id, location] of Object.entries(locations)) {
      // maybe caller should be aware of "location"ness 
      points[id] = TileUtils.latLngToWorldCoord(
        new google.maps.LatLng(location.point.latitude, location.point.longitude)
      )
    }
    tileData = TileDataMutator.addPoints(tileData, tileCache.subnets[subnetId], points)
    return dispatch({
      type: Actions.SUBNET_TILES_UPDATE_DATA,
      payload: {
        subnetId, 
        tileData,
      }
    })
  }
}

function setSubnetsData (subnetsData) {
  // gaurd against empty set?
  return (dispatch) => {
    return batch(() => {
      for (const [subnetId, locations] of Object.entries(subnetsData)) {
        dispatch(setSubnetData(subnetId, locations))
      }
    })
  }
}

function clearSubnetDataAndCache () {
  return (dispatch, getState) => {
    const subnetTileData = getState().subnetTileData
    // clear tile cache
    Object.keys(subnetTileData).forEach(subnetId => {
      tileCache.subnets[subnetId].clear()
    })
    // clear data
    return dispatch({
      type: Actions.SUBNET_TILES_CLEAR_DATA
    })
  }
}

// --- //

export default {
  setSubnetData,
  setSubnetsData,
  clearSubnetDataAndCache,
}
