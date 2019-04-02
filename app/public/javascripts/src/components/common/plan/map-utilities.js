import Constants from '../constants'
import gpsi from 'geojson-polygon-self-intersections'

class MapUtilities {
  // Returns the tile coordinates (x, y) for a given lat/long and zoom level
  static getTileCoordinates (zoom, lat, lng) {
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

  static getVisibleTiles (mapRef) {
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

  // Get the pixel coordinates of the clicked point WITHIN a tile (relative to the top left corner of the tile)
  static getPixelCoordinatesWithinTile (zoom, tileCoords, lat, lng) {
    // 1. Get the top left coordinates of the tile in lat lngs
    var nwCornerLatLng = this.getNWTileCornerLatLng(zoom, tileCoords.x, tileCoords.y)
    // 2. Convert to pixels
    var nwCornerPixels = this.getPixelCoordinatesFromLatLng(nwCornerLatLng, zoom)
    // 3. Convert the clicked lat lng to pixels
    var clickedPointPixels = this.getPixelCoordinatesFromLatLng({ lat: lat, lng: lng }, zoom)

    return {
      x: clickedPointPixels.x - nwCornerPixels.x,
      y: clickedPointPixels.y - nwCornerPixels.y
    }
  }

  // Returns the latitiude and longitude of the northwest corner of a tile
  // http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_numbers_to_lon..2Flat.
  static getNWTileCornerLatLng (tileZoom, tileX, tileY) {
    var n = Math.pow(2.0, tileZoom)
    var lon_deg = tileX / n * 360.0 - 180.0
    var lat_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * tileY / n)))
    var lat_deg = lat_rad * 180.0 / Math.PI
    return {
      lat: lat_deg,
      lng: lon_deg
    }
  }

  static getTileLatLngBounds (tileZoom, tileX, tileY) {
    var NELatLng = MapUtilities.getNWTileCornerLatLng(tileZoom, tileX + 1, tileY)
    var SWLatLng = MapUtilities.getNWTileCornerLatLng(tileZoom, tileX, tileY + 1)

    return {
      maxY: NELatLng.lat,
      maxX: NELatLng.lng,
      minY: SWLatLng.lat,
      minX: SWLatLng.lng
    }
  }

  // Returns the GLOBAL pixel coordinates (not screen pixel coordinates) for a lat long
  // https://developers.google.com/maps/documentation/javascript/examples/map-coordinates
  static getPixelCoordinatesFromLatLng (latLng, zoom) {
    var siny = Math.sin(latLng.lat * Math.PI / 180)
    // Truncating to 0.9999 effectively limits latitude to 89.189. This is
    // about a third of a tile past the edge of the world tile.
    siny = Math.min(Math.max(siny, -0.9999), 0.9999)

    var xUnscaled = Constants.TILE_SIZE * (0.5 + latLng.lng / 360)
    var yUnscaled = Constants.TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI))

    var scale = Math.pow(2.0, zoom)
    return {
      x: Math.floor(xUnscaled * scale),
      y: Math.floor(yUnscaled * scale)
    }
  }

  // https://www.npmjs.com/package/geojson-polygon-self-intersections
  // check for self Intersection of a polygon
  static isPolygonValid (polygon) {
    var options = {
      useSpatialIndex: false
    }
    var selfIntersectingPoints = gpsi(polygon, function filterFn (unique) { return [unique] }, options)
    return selfIntersectingPoints.length === 0
  }

  // Convert the paths in a Google Maps object into a Polygon WKT
  static polygonPathsToWKT (paths) {
    var allPaths = []
    paths.forEach((path) => {
      var pathPoints = []
      path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
      allPaths.push(pathPoints)
    })
    return {
      type: 'Polygon',
      coordinates: allPaths
    }
  }
}

export default MapUtilities
