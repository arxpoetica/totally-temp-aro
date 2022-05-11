// I invisioned this as a sealed class with accessors. 
//  We're going to try to translate that to the more functional-style Redux paradigm.

// operates on a TileData object of the structure
// tileData[x][y][pointId] : worldCoord
// the TileData object should not be directly augmented, use these functions:

import TileUtils from "./tile-overlay-utils.js"

let TileDataMutator = {}


TileDataMutator.getNewTileData = () => {return {}} // just here for expansibility

TileDataMutator.addPoint = (tileData, tileCache, pointId, worldCoord) => {
  //get tile id from worldCoord
  let allTileIds = TileUtils.getAllTileIdsForWorldCoord(worldCoord)
  let tileId = allTileIds[0]
  //add pointId to list
  if (!tileData[tileId.x]) tileData[tileId.x] = {}
  if (!tileData[tileId.x][tileId.y]) tileData[tileId.x][tileId.y] = {}
  tileData[tileId.x][tileId.y][pointId] = worldCoord
  //delete cached imageS
  tileCache.deleteTiles(allTileIds)
  return tileData
}

TileDataMutator.deletePoint = (tileData, tileCache, pointId, worldCoord) => {
  //get tile id from worldCoord
  let allTileIds = TileUtils.getAllTileIdsForWorldCoord(worldCoord)
  let tileId = allTileIds[0]
  //remove pointId from list
  if (
    tileData[tileId.x]
    && tileData[tileId.x][tileId.y]
    && tileData[tileId.x][tileId.y][pointId]
  ) {
    delete tileData[tileId.x][tileId.y][pointId]
    if (!Object.keys(tileData[tileId.x][tileId.y]).length) {
      delete tileData[tileId.x][tileId.y]
      if (!Object.keys(tileData[tileId.x]).length) {
        delete tileData[tileId.x]
      }
    }
    //delete cached imageS
    tileCache.deleteTiles(allTileIds)
  }
  return tileData
}

TileDataMutator.movePoint = (tileData, tileCache, pointId, fromWorldCoord, toWorldCoord) => {
  tileData = TileDataMutator.deletePoint(tileData, tileCache, pointId, fromWorldCoord)
  tileData = TileDataMutator.addPoint(tileData, tileCache, pointId, toWorldCoord)
  return tileData
}

TileDataMutator.addPoints = (tileData, tileCache, points) => {
  for (const [pointId, worldCoord] of Object.entries(points)) {
    tileData = TileDataMutator.addPoint(tileData, tileCache, pointId, worldCoord)
  }
  return tileData
}

TileDataMutator.deletePoints = (tileData, tileCache, points) => {
  for (const [pointId, worldCoord] of Object.entries(points)) {
    tileData = TileDataMutator.deletePoint(tileData, tileCache, pointId, worldCoord)
  }
  return tileData
}

TileDataMutator.getPointsForLeafTileRect = (tileData, nwTileId, seTileId) => {
  let minX = Math.min(nwTileId.x, seTileId.x)
  let maxX = Math.max(nwTileId.x, seTileId.x)
  let minY = Math.min(nwTileId.y, seTileId.y)
  let maxY = Math.max(nwTileId.y, seTileId.y)
  let points = {}
  
  for (let x=minX; x<maxX; x++) {
    for (let y=minY; y<maxY; y++) {
      if (tileData[x] && tileData[x][y]) points = { ...points, ...tileData[x][y] }
      // if (tileData[x] && tileData[x][y]) {
      //   points.push(tileData[x][y])
      // }
    }
  }
  
  return points
}

TileDataMutator.getPointsForTile = (tileData, tileId) => {
  let leafTileRect = TileUtils.getLeafTileRectForTile(tileId)
  return TileDataMutator.getPointsForLeafTileRect(tileData, leafTileRect.nwTileId, leafTileRect.seTileId)
}

TileDataMutator.getPointsUnderClick = (tileData, latLng, zoom, size=null) => {
  // size is number of pixels at current zoom level
  if (null === size) size = 8
  size = Math.ceil(size * 0.5)
  let points = {}
  let worldCoord = TileUtils.latLngToWorldCoord(latLng)
  let nwCoords = {}
  let seCoords = {}
  // scale size by zoom level
  size = size * (1 << (TileUtils.MAX_ZOOM - zoom))
  ['x', 'y'].forEach(dimention => {
    nwCoords[dimention] = worldCoord[dimention] - size
    seCoords[dimention] = worldCoord[dimention] + size
  })
  let nwTileId = TileUtils.worldCoordToLeafTileId(nwCoords)
  let seTileId = TileUtils.worldCoordToLeafTileId(seCoords)
  let allPoints = TileDataMutator.getPointsForLeafTileRect(tileData, nwTileId, seTileId)
  for (const [pointId, worldCoord] of Object.entries(allPoints)) {
    if ( nwCoords.x <= worldCoord.x
      && worldCoord.x < seCoords.x
      && nwCoords.y <= worldCoord.y
      && worldCoord.y < seCoords.y
    ) {
      points[pointId] = worldCoord
    }
  }
  return points
}

Object.freeze(TileDataMutator)
export default TileDataMutator
