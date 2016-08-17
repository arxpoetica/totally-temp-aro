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

  utils.createCenteredMarker = (layer, feature, centroid, hoverStyle) => {
    var count = 0
    var timer = null
    var marker = new google.maps.Marker({ map: map })

    function updateCounter (i) {
      count += i
      timer && clearTimeout(timer)
      if (count > 0) {
        !marker.getMap() && marker.setMap(map)
        layer.overrideStyle(feature, hoverStyle)
      } else {
        timer = setTimeout(() => {
          marker.setMap(null)
          layer.revertStyle(feature)
        }, 0)
      }
    }

    marker.addListener('mouseover', () => updateCounter(1))
    marker.addListener('mouseout', () => updateCounter(-1))

    layer.addListener('mouseout', (e) => {
      if (e.feature !== feature) return
      updateCounter(-1)
    })

    layer.addListener('mouseover', (e) => {
      if (e.feature !== feature) return
      layer.overrideStyle(feature, hoverStyle)
      marker.setPosition(centroid)
      updateCounter(1)
    })

    // var listener = (e) => {
    //   if (e.feature === feature) {
    //     marker.setMap(null)
    //     layer.removeListener('removefeature', listener)
    //     timer && clearTimeout(timer)
    //   }
    // }
    // layer.addListener('removefeature', listener)

    return marker
  }

  return utils
})
