/* global google */
class Utils {

  // Converts a Google Maps LatLng object into a WKT Point Geometry object
  static getGeometryFromGoogleMapLatLng (latLng) {
    return {
      type: 'Point',
      coordinates: [latLng.lng(), latLng.lat()]
    }
  }

  // Converts a WKT Point Geometry object into a Google Maps LatLng object
  static getGoogleMapLatLngFromGeometry (geometry) {
    if (geometry.type !== 'Point') {
      throw new Error(`getGoogleMapLatLngFromGeometry() expects geometry of type Point, received ${geometry.type}`)
    }
    return new google.maps.LatLng(geometry.coordinates[1], geometry.coordinates[0])
  }

  // Converts a Google Maps Path object into a WKT MultiPolygon Geometry object
  static getGeometryFromGoogleMapPaths (paths) {
    var geometry = {
      type: 'MultiPolygon',
      coordinates: [[]]
    }
    paths.forEach((path) => {
      var pathPoints = []
      path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
      pathPoints.push(pathPoints[0]) // Close the polygon
      geometry.coordinates[0].push(pathPoints)
    })
    return geometry
  }

  // Converts a WKT MultiPolygon Geometry object into a Google Maps Path object
  static getGoogleMapPathsFromGeometry (geometry) {
    if (geometry.type !== 'MultiPolygon') {
      throw new Error(`getGoogleMapPathsFromGeometry() expects geometry of type MultiPolygon, received ${geometry.type}`)
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

  // Return true if the given path is a closed path
  static isClosedPath (path) {
    const firstPoint = path.getAt(0)
    const lastPoint = path.getAt(path.length - 1)
    const deltaLat = Math.abs(firstPoint.lat() - lastPoint.lat())
    const deltaLng = Math.abs(firstPoint.lng() - lastPoint.lng())
    const TOLERANCE = 0.0001
    return (deltaLat < TOLERANCE) && (deltaLng < TOLERANCE)
  }
}

export default Utils
