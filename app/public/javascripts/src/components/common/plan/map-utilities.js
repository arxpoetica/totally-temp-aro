class MapUtilities {

  // Returns the tile coordinates (x, y) for a given lat/long and zoom level
  static getTileCoordinates(zoom, lat, lng) {
    // Using Mercator projection.
    // https://gis.stackexchange.com/questions/133205/wmts-convert-geolocation-lat-long-to-tile-index-at-a-given-zoom-level
    var n = Math.pow(2.0, zoom)
    var tileX = Math.floor((lng + 180.0) / 360.0 * n)
    var latRad = lat * Math.PI / 180.0
    var tileY = Math.floor((1.0 - Math.log(Math.tan(latRad) + (1 / Math.cos(latRad))) / Math.PI) / 2.0 * n)

    return {
      x: tileX,
      y: tileY
    }
  }

  static getVisibleTiles(mapRef) {
    if (!mapRef || !mapRef.getBounds()) {
      return
    }
    // get a list of tiles that are visible on the screen.
    var visibleTiles = []
    var mapBounds = mapRef.getBounds()
    var neCorner = mapBounds.getNorthEast()
    var swCorner = mapBounds.getSouthWest()
    var zoom = mapRef.getZoom()
    // Note the swap from NE/SW to NW/SE when finding tile coordinates
    var tileCoordsNW = this.getTileCoordinates(zoom, neCorner.lat(), swCorner.lng())
    var tileCoordsSE = this.getTileCoordinates(zoom, swCorner.lat(), neCorner.lng())

    for (var x = tileCoordsNW.x; x <= tileCoordsSE.x; ++x) {
      for (var y = tileCoordsNW.y; y <= tileCoordsSE.y; ++y) {
        visibleTiles.push({
          zoom: zoom,
          x: x,
          y: y
        })
      }
    }

    return visibleTiles
  }
}

export default MapUtilities
