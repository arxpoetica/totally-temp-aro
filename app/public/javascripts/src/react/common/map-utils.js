class MapUtils {
  // Convert from pixel coordinates to latlngs. https://stackoverflow.com/a/30541162
  static pixelToLatlng (googleMap, xcoor, ycoor) {
    var ne = googleMap.getBounds().getNorthEast()
    var sw = googleMap.getBounds().getSouthWest()
    var projection = googleMap.getProjection()
    var topRight = projection.fromLatLngToPoint(ne)
    var bottomLeft = projection.fromLatLngToPoint(sw)
    var scale = 1 << googleMap.getZoom()
    var newLatlng = projection.fromPointToLatLng(new google.maps.Point(xcoor / scale + bottomLeft.x, ycoor / scale + topRight.y))
    return newLatlng
  }
}

export default MapUtils
