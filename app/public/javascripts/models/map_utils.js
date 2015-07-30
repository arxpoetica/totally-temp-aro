app.service('map_utils', function($rootScope, $http) {

  var utils = {};

  utils.fromLatLngToPoint = function(latLng) {
    var projection = map.getProjection();
    var topRight = projection.fromLatLngToPoint(map.getBounds().getNorthEast());
    var bottomLeft = projection.fromLatLngToPoint(map.getBounds().getSouthWest());
    var scale = Math.pow(2, map.getZoom());
    var worldPoint = projection.fromLatLngToPoint(latLng);
    return new google.maps.Point((worldPoint.x - bottomLeft.x) * scale, (worldPoint.y - topRight.y) * scale);
  }

  return utils;

});
