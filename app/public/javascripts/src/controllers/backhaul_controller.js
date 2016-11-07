/* global app google map $ */
app.controller('backhaul-controller', ['$scope', '$rootScope', '$http', 'map_tools', ($scope, $rootScope, $http, map_tools) => {
  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
    $scope.selectedEquipment = []
    previousFeature = null
    recalculateLines()
    if (!plan) return
    $http.get(`/backhaul/${plan.id}/links`).success((response) => {
      var m = map_tools.is_visible('backhaul') ? map : null
      response.forEach((item, i) => {
        var from = item.from_geom.coordinates
        var to = item.to_geom.coordinates
        var pointFrom = { lat: from[1], lng: from[0] }
        var pointTo = { lat: to[1], lng: to[0] }
        $scope.selectedEquipment.push({
          name: `${2 * i + 1} -> ${2 * i + 2}`,
          id: item.id,
          line: new google.maps.Polyline({
            path: [pointFrom, pointTo],
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
          }),
          points: [pointFrom, pointTo],
          markers: [
            new google.maps.Marker({ map: m, position: pointFrom }),
            new google.maps.Marker({ map: m, position: pointTo })
          ]
        })
      })
      recalculateLines()
    })
  })

  function recalculateLines () {
    $scope.selectedEquipment.forEach((equipment, i) => {
      equipment.name = `${2 * i + 1} -> ${2 * i + 2}`
      equipment.markers[0].setIcon({
        anchor: new google.maps.Point(10, 40),
        url: `https://chart.googleapis.com/chart?chst=d_bubble_text_small_withshadow&chld=bb|${encodeURIComponent(String(2 * i + 1))}|FF8|000`
      })
      equipment.markers[1].setIcon({
        anchor: new google.maps.Point(10, 40),
        url: `https://chart.googleapis.com/chart?chst=d_bubble_text_small_withshadow&chld=bb|${encodeURIComponent(String(2 * i + 2))}|FF8|000`
      })
    })
  }

  $scope.selectedEquipment = []
  $scope.addEquipment = () => {
    $rootScope.$broadcast('edit-backhaul')
  }

  $scope.removeEquipment = (equipment) => {
    var i = $scope.selectedEquipment.indexOf(equipment)
    if (i >= 0) {
      var eq = $scope.selectedEquipment.splice(i, 1)[0]
      eq.line.setMap(null)
      eq.markers[0].setMap(null)
      eq.markers[1].setMap(null)
    }
    recalculateLines()
  }

  $scope.createLinks = () => {
    var data = {
      ids: $scope.selectedEquipment.map((equipment) => equipment.id)
    }
    $http.post(`/backhaul/${$scope.plan.id}/links`, data).success((response) => {
      console.log('response', response)
    })
  }

  var previousFeature = null
  $rootScope.$on('map_layer_clicked_feature', (e, event, layer) => {
    if (layer.type !== 'network_nodes') return
    if (!map_tools.is_visible('backhaul')) return
    if (!previousFeature) {
      previousFeature = event.feature
      return
    }
    var feature = event.feature
    var pointFrom = previousFeature.getGeometry().get()
    var pointTo = feature.getGeometry().get()
    // var bounds = new google.maps.LatLngBounds();
    // bounds.extend(pointFrom)
    // bounds.extend(pointTo)
    $scope.selectedEquipment.push({
      name: 'node',
      line: new google.maps.Polyline({
        path: [pointFrom, pointTo],
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
      }),
      points: [pointFrom, pointTo],
      markers: [
        new google.maps.Marker({ map: map, position: pointFrom }),
        new google.maps.Marker({ map: map, position: pointTo })
      ]
    })
    recalculateLines()
    if (!$rootScope.$$phase) { $rootScope.$apply() }
  })

  $rootScope.$on('map_tool_changed_visibility', () => {
    var m = map_tools.is_visible('backhaul') ? map : null
    $scope.selectedEquipment.forEach((equipment) => {
      equipment.line.setMap(m)
      equipment.markers.forEach((marker) => marker.setMap(m))
    })
  })

  $(document).keydown((e) => {
    if (e.keyCode === 27 && map_tools.is_visible('backhaul')) {
      $scope.selectedEquipment.forEach((equipment) => {
        var m = equipment.line.getMap() ? null : map
        equipment.line.setMap(m)
        equipment.markers.forEach((marker) => marker.setMap(m))
      })
    }
  })
}])
