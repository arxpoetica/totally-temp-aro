class Utils {
  static getGeometryFromPaths (paths) {
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

  static getPathFromGeometry (geometry) {
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
