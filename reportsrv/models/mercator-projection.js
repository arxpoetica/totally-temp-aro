// A class that will use the Mercator projection to convert latitude/longitude
// to y/x and back. Uses details from
// Mercator projection - https://en.wikipedia.org/wiki/Mercator_projection
// EPSG:900913 (used by Google Maps) - https://epsg.io/900913

const degToRad = degrees => degrees * Math.PI / 180.0
const radToDeg = radians => radians * 180.0 / Math.PI

class MercatorProjection {
  constructor (sphereRadius = MercatorProjection.EPSG_900913_SPHERE_RADIUS) {
    // The sphere radius is determined by the scaling factor that we want to achieve.
    this.sphereRadius = sphereRadius
  }

  // Takes a longitude in degrees and converts it to X coordinate
  longitudeToX (longitude) {
    return this.sphereRadius * degToRad(longitude)
  }

  // Takes a latitude in degrees and coverts it to Y coordinate
  latitudeToY (latitude) {
    return this.sphereRadius * Math.log(Math.tan((Math.PI / 4) + (degToRad(latitude) / 2)))
  }

  // Takes a X coordinate and converts it to longitude in degrees
  xToLongitude (x) {
    return radToDeg(x / this.sphereRadius)
  }

  // Takes a Y coordinate and converts it to latitude in degrees
  yToLatitude (y) {
    return radToDeg((2 * Math.atan(Math.exp(y / this.sphereRadius))) - (Math.PI / 2))
  }
}

MercatorProjection.EPSG_900913_SPHERE_RADIUS = 6378137

module.exports = MercatorProjection
