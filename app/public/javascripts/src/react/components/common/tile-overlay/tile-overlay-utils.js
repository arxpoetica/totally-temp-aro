// Lat Long to world coordinate via the mercator projection
// https://developers.google.com/maps/documentation/javascript/examples/map-coordinates

let TileUtils = {}

TileUtils.TILE_SIZE_MAGNITUDE = 8 // 2^x = TILE_SIZE, 2^8=256
TileUtils.TILE_SIZE = Math.pow(2, TileUtils.TILE_SIZE_MAGNITUDE)
TileUtils.MIN_ZOOM = 9
TileUtils.MAX_ZOOM = 21
TileUtils.LEAF_SCALE = 1 << TileUtils.MAX_ZOOM
TileUtils.LEAF_SCALE_DELTA = 1 << (TileUtils.MAX_ZOOM - TileUtils.TILE_SIZE_MAGNITUDE)

// for optimization we take case of divisions and other known calculations once up front
TileUtils.ONE_OVER_360 = 1 / 360
TileUtils.ONE_OVER_4_PI = 1 / (4 * Math.PI)
TileUtils.PI_OVER_180 = Math.PI / 180

TileUtils.TILE_MARGIN = 8 // per side! so canvas H and W will be TILE_SIZE + (2 * TILE_MARGIN)

TileUtils.Point = (x=null, y=null, z=null) => {
  return {x,y,z}
}

TileUtils.coordToTileId = (coord, zoom) => {
  return TileUtils.Point(coord.x, coord.y, zoom)
}

// below is my optimization of the function found at 
//  https://developers.google.com/maps/documentation/javascript/examples/map-coordinates
// The mapping between latitude, longitude and pixels is defined by the web
// Mercator projection.
TileUtils.latLngToWorldCoord = (latLng/* :google.maps.LatLng */) => {
  //let sinY = Math.sin((latLng.lat() * Math.PI) / 180)
  let sinY = Math.sin( latLng.lat() * TileUtils.PI_OVER_180 )

  // Truncating to 0.9999 effectively limits latitude to 89.189. This is
  // about a third of a tile past the edge of the world tile.
  // (at 1 or -1 we'd get infinite scaling)
  sinY = Math.min(Math.max(sinY, -0.9999), 0.9999)

  // Longitude goes from West to East, -180 to +180 (0 being the Prime Meridian running through Greenwich, England)
  // Latitude goes from South Pole to North Pole, -90 to +90
  //  with the Mercator projection the top and bottom are stretched to project a sphere onto a flat square
  //  So the distance between Latitudes gets larger the further from the equator you go
  //  so that Longitude lines appear parallel (instead of converging) 
  //  and locally height and width are kept proportional 
  // y = log(x) ... x = e^y (e being Euler's number)
  return TileUtils.Point(
    // turn Lng from -180 -> +180 to 0 -> 1, times tile size
    // TileUtils.TILE_SIZE * (0.5 + (latLng.lng() / 360)),
    ((latLng.lng() + 180) * TileUtils.ONE_OVER_360 * TileUtils.TILE_SIZE),
    // 
    TileUtils.TILE_SIZE * (0.5 - Math.log((1 + sinY) / (1 - sinY)) / (4 * Math.PI)),
  )
}

TileUtils.worldCoordToLeafTileId = (worldCoord) => {
  return TileUtils.Point(
    //Math.floor((worldCoord.x * TileUtils.LEAF_SCALE) / TileUtils.TILE_SIZE),
    //Math.floor((worldCoord.y * TileUtils.LEAF_SCALE) / TileUtils.TILE_SIZE),
    Math.floor(worldCoord.x * TileUtils.LEAF_SCALE_DELTA),
    Math.floor(worldCoord.y * TileUtils.LEAF_SCALE_DELTA),
    TileUtils.MAX_ZOOM,
  )
}

TileUtils.worldCoordToTilePixel = (worldCoord, tileId) => {
  const scale = 1 << tileId.z
  let px = {
    x: Math.floor(worldCoord.x * scale) - (tileId.x * TileUtils.TILE_SIZE),
    y: Math.floor(worldCoord.y * scale) - (tileId.y * TileUtils.TILE_SIZE),
  }
  return px
}

TileUtils.latLngToLeafTileId = (latLng) => {
  let worldCoord = TileUtils.latLngToWorldCoord(latLng)
  return TileUtils.worldCoordToLeafTileId(worldCoord)
}

// gets Id for every tile that contains leaf tile, at every zoom level including leaf level zoom
TileUtils.getAllTileIdsForLeafTileId = (leafTileId) => {
  let tileIds = [leafTileId]
  // for all zoom levels scale tileId and add to list (this will include z)
  for (let scaleLevel = TileUtils.MAX_ZOOM+1; scaleLevel >= TileUtils.MIN_ZOOM; scaleLevel--){
    let scaleDif = TileUtils.MAX_ZOOM - scaleLevel
    let tileId = {'z': scaleLevel}
    let dimentions = ['x', 'y']
    dimentions.forEach(dimention => {
      tileId[dimention] = leafTileId[dimention] >> scaleDif // bit shift back up the chain
    })
    tileIds.push(tileId)
  }
  return tileIds
}

// gets Id for every tile that contains worldCoord, at every zoom level 
TileUtils.getAllTileIdsForWorldCoord = (worldCoord) => {
  let leafTileId = TileUtils.worldCoordToLeafTileId(worldCoord)
  return TileUtils.getAllTileIdsForLeafTileId(leafTileId)
}

TileUtils.getLeafTileRectForTile = (tileId) => {
  let nwTileId = {'z': TileUtils.MAX_ZOOM}
  let seTileId = {'z': TileUtils.MAX_ZOOM}
  let scale = 1 << (TileUtils.MAX_ZOOM - tileId.z)
  let dimentions = ['x', 'y']
  dimentions.forEach(dimention => {
    nwTileId[dimention] = scale * tileId[dimention]
    // nw corner of next large tile to the se, 
    //  get the leaf id of that corner 
    //  then get the id of the leaf 1 to the nw
    seTileId[dimention] = (scale * (tileId[dimention] + 1)) - 1
  })
  return {nwTileId, seTileId}
}

Object.freeze(TileUtils)
export default TileUtils
