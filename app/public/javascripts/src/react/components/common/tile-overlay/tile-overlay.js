
import TileUtils from './tile-overlay-utils'
import TileDataMutator from './tile-data-mutator'
import tileIcons from './tile-icons'
//import { tileCaches } from './tile-cache'

let mapIcons = tileIcons.mapIcons
let iconBadges = tileIcons.iconBadges

export const overlayTypes = {
  POINT: 'POINT',
  LINE: 'LINE',
  POLYGON: 'POLYGON' // includes multipolygon
}
// this will probably be turned to a super-class and subClassed to 
//  PointTileOverlay, LineTileOverlay, PolygonTileOverlay - each extends TileOverlay
//  each of those subclassed to suit specfic needs of the layer 
//  SubnetLocationTileOverlay extends PointTileOverlay

// should this be a static class/utility? it doesn't keep state 
export default class TileOverlay {
  constructor (tileData, tileCache, metaById, badgeLists = {}, defaultBadges = []) {
    this.type = overlayTypes.POINT // should be a const but I don't want to make a static getter which is currently the only way 
    this.tileData = tileData
    this.tileCache = tileCache
    this.metaById = metaById
    this.badgeLists = badgeLists
    this.defaultBadges = defaultBadges
  }

  renderTileCanvas (ownerDocument, points, tileId) {
    var canvas = ownerDocument.createElement('canvas')
    canvas.width = TileUtils.TILE_SIZE + (2 * TileUtils.TILE_MARGIN)
    canvas.height = TileUtils.TILE_SIZE + (2 * TileUtils.TILE_MARGIN)
    var ctx = canvas.getContext('2d')
    //ctx.fillStyle = '#99FF99'
    
    for (const [id, point] of Object.entries(points)) {
      let px = TileUtils.worldCoordToTilePixel(point, tileId)
      px.x += TileUtils.TILE_MARGIN
      px.y += TileUtils.TILE_MARGIN
      // get icon type
      let iconType = this.metaById[id].locationEntityType
      let icon = mapIcons[iconType]
      // TODO: locationEntityType is not consistent across Service
      //  eg: sometimes it's "medium_businesses" 
      //      in drafts it's "medium"
      let imageCoord = {
        x: px.x - icon.offset.x,
        y: px.y - icon.offset.y,
      }
      ctx.drawImage(
        icon.image, 
        imageCoord.x, 
        imageCoord.y,
      )
      // figure badges
      // for each badge
      for (const [badgeId, badge] of Object.entries(iconBadges)) {
        // badgeLists is a collection of id collectiions with the schema 
        //  badgeLists: {
        //    $badgeId: {
        //      $pointId: bool
        //    }
        //  }
        //  if the badgeLists isn't present
        //    or if the pointId isn't in the list 
        //    or if the value of badgeLists[badgeId][id] is false
        //    the badge will not be drawn for this point, all three are valid means and are usful in different scenarios 
        
        if (
          this.defaultBadges.includes(badgeId)
          || (this.badgeLists[badgeId] && this.badgeLists[badgeId][id])
        ) {
          let badgeCoord = {
            x: imageCoord.x + badge.offset.x + (icon.image.width * badge.offsetMult.w),
            y: imageCoord.y + badge.offset.y + (icon.image.width * badge.offsetMult.h)
          }
          ctx.drawImage(
            badge.image, 
            badgeCoord.x, 
            badgeCoord.y,
          )
        }
      }
    }

    return canvas
  }

  getTileCanvas (ownerDocument, tileId) {
    if (!this.tileCache) return null // just a bit of defense 
    let tile = this.tileCache.getTile(tileId)
    if (!tile) {
      // not in the cache so render it
      //let begin = window.performance.now()
      let points = TileDataMutator.getPointsForTile(this.tileData, tileId)
      if (Object.keys(points).length) {
        // render tile
        tile = this.renderTileCanvas(ownerDocument, points, tileId)
        this.tileCache.addTile(tile, tileId)
      }
      //let elapse = window.performance.now() - begin
      //console.log(`${elapse} milliseconds`)
    }
    return tile
  }

  // mouse event stuff
  getPointsUnderClick (latLng, zoom) {
    return TileDataMutator.getPointsUnderClick(this.tileData, latLng, zoom)
  }

  // doesn't keep state or have listeners so no de-init needed

}
