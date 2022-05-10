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
  return (dispatch, getState) => {
    //const state = getState()
    let tileData = TileDataMutator.getNewTileData()
    // if (state.subnetTileData[subnetId]) {
    //   tileData = klona(state.subnetTileData[subnetId])
    // }
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
  return (dispatch) => {
    return batch(() => {
      for (const [subnetId, locations] of Object.entries(subnetsData)) {
        dispatch(setSubnetData(subnetId, locations))
      }
    })
  }
}

// --- //

export default {
  setSubnetData,
  setSubnetsData,
}
