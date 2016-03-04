/* global app map google */
app.service('map_utils', ($rootScope, $http) => {
  var utils = {}

  utils.fromLatLngToPoint = (latLng) => {
    var projection = map.getProjection()
    var topRight = projection.fromLatLngToPoint(map.getBounds().getNorthEast())
    var bottomLeft = projection.fromLatLngToPoint(map.getBounds().getSouthWest())
    var scale = Math.pow(2, map.getZoom())
    var worldPoint = projection.fromLatLngToPoint(latLng)
    return new google.maps.Point((worldPoint.x - bottomLeft.x) * scale, (worldPoint.y - topRight.y) * scale)
  }

  return utils
})
