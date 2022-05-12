import { klona } from 'klona'
import Actions from "../../common/actions"
import TileDataMutator from "../common/tile-overlay/tile-data-mutator"
import { TileCache } from "../common/tile-overlay/tile-cache"
import TileUtils from '../common/tile-overlay/tile-overlay-utils'
import { batch } from 'react-redux'
// global: tileCache.subnets

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
  console.log(subnetsData)
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
