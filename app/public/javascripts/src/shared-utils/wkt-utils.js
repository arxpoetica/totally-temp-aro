/* global google MouseEvent */
class WktUtils {
  // Converts a Google Maps LatLng object into a WKT Point Geometry object
  static getWKTPointFromGoogleMapLatLng (latLng) {
    return {
      type: 'Point',
      coordinates: [latLng.lng(), latLng.lat()]
    }
  }

  // Converts a WKT Point Geometry object into a Google Maps LatLng object
  static getGoogleMapLatLngFromWKTPoint (geometry) {
    if (geometry.type !== 'Point') {
      throw new Error(`getGoogleMapLatLngFromWKTPoint() expects geometry of type Point, received ${geometry.type}`)
    }
    return new google.maps.LatLng(geometry.coordinates[1], geometry.coordinates[0])
  }

  // Converts a Google Maps Path object into a WKT MultiPolygon Geometry object
  static getWKTMultiPolygonFromGoogleMapPaths (paths) {
    var geometry = {
      type: 'MultiPolygon',
      coordinates: [[]]
    }
    paths.forEach((path) => {
      var pathPoints = []
      path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
      if (JSON.stringify(pathPoints[0]) !== JSON.stringify(pathPoints[pathPoints.length-1])) {
        console.log("not closed")
        pathPoints.push(pathPoints[0]) // Close the polygon
      }
      geometry.coordinates[0].push(pathPoints)
    })
    return geometry
  }

  // Converts a Google Maps Path object into a WKT Polygon Geometry object
  static getWKTPolygonFromGoogleMapPath (path) {
    var geometry = {
      type: 'Polygon',
      coordinates: []
    }
    var pathPoints = []
    path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
    pathPoints.push(pathPoints[0]) // Close the polygon
    geometry.coordinates.push(pathPoints)
    return geometry
  }

  // Converts a WKT MultiPolygon Geometry object into a Google Maps Path object
  static getGoogleMapPathsFromWKTMultiPolygon (geometry) {
    if (geometry.type !== 'MultiPolygon') {
      throw new Error(`getGoogleMapPathsFromWKTMultiPolygon() expects geometry of type MultiPolygon, received ${geometry.type}`)
    }
    var polygonPath = []
    geometry.coordinates[0][0].forEach((polygonVertex) => {
      polygonPath.push({
        lat: polygonVertex[1],
        lng: polygonVertex[0]
      })
    })
    return polygonPath
  }

  // Converts a WKT Polygon Geometry object into a Google Maps Path object
  static getGoogleMapPathsFromWKTPolygon (geometry) {
    if (geometry.type !== 'Polygon') {
      throw new Error(`getGoogleMapPathsFromWKTPolygon() expects geometry of type Polygon, received ${geometry.type}`)
    }
    var polygonPath = []
    geometry.coordinates[0].forEach((polygonVertex) => {
      polygonPath.push({
        lat: polygonVertex[1],
        lng: polygonVertex[0]
      })
    })
    return polygonPath
  }

  // Converts a Google Maps Path object into a WKT LineString Geometry object
  static getWKTLineStringFromGoogleMapPath (path) {
    var geometry = {
      type: 'LineString',
      coordinates: path.getArray().map(pathPoint => [pathPoint.lng(), pathPoint.lat()])
    }
    return geometry
  }

  // Converts a WKT LineString Geometry object into a Google Maps Path
  static getGoogleMapPathsFromWKTLineString (geometry) {
    if (geometry.type !== 'LineString') {
      throw new Error(`getGoogleMapPathsFromWKTLineString() expects geometry of type LineString, received ${geometry.type}`)
    }
    var linePaths = geometry.coordinates.map(vertex => ({ lat: vertex[1], lng: vertex[0] }))
    return linePaths
  }

  // Converts a WKT MultiLineString Geometry object into a Google Maps Path
  static getGoogleMapPathsFromWKTMultiLineString (geometry) {
    if (geometry.type !== 'MultiLineString') {
      throw new Error(`getGoogleMapPathsFromWKTMultiLineString() expects geometry of type MultiLineString, received ${geometry.type}`)
    }
    var linePaths = []
    geometry.coordinates.forEach(line => {
      var linePath = line.map(vertex => ({ lat: vertex[1], lng: vertex[0] }))
      linePaths.push(linePath)
    })
    return linePaths
  }

  // Return true if the given path is a closed path
  static isClosedPath (path) {
    const firstPoint = path.getAt(0)
    const lastPoint = path.getAt(path.length - 1)
    const deltaLat = Math.abs(firstPoint.lat() - lastPoint.lat())
    const deltaLng = Math.abs(firstPoint.lng() - lastPoint.lng())
    const TOLERANCE = 0.0001
    return (deltaLat < TOLERANCE) && (deltaLng < TOLERANCE)
  }

  // Returns the x, y coordinates in pixels from a map object rightclick event
  static getXYFromEvent (event) {
    var mouseEvent = null
    Object.keys(event).forEach((eventKey) => {
      if (event[eventKey] instanceof MouseEvent) {
        mouseEvent = event[eventKey]
      }
    })
    return {
      x: mouseEvent.clientX,
      y: mouseEvent.clientY
    }
  }
}

export default WktUtils
