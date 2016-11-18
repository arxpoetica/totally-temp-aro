/* global app google map $ */
app.controller('backhaul-controller', ['$scope', '$rootScope', '$http', 'map_tools', 'MapLayer', ($scope, $rootScope, $http, map_tools, MapLayer) => {
  $scope.plan = null
  $scope.addingLinks = false
  $scope.isEquipmentVisible = false

  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
    $scope.selectedEquipment.forEach((equipment) => {
      equipment.line.setMap(null)
      equipment.marker.setMap(null)
    })
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
          name: '',
          id: item.id,
          line: new google.maps.Polyline({
            path: [pointFrom, pointTo],
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
          }),
          points: [pointFrom, pointTo],
          marker: new google.maps.Marker({ map: m, position: center(pointFrom, pointTo) }),
          from_link_id: item.from_link_id,
          to_link_id: item.to_link_id
        })
      })
      recalculateLines()
    })
  })

  function recalculateLines () {
    $scope.selectedEquipment.forEach((equipment, i) => {
      equipment.name = `link ${i + 1}`
      equipment.marker.setIcon({
        anchor: new google.maps.Point(10, 40),
        url: `https://chart.googleapis.com/chart?chst=d_bubble_text_small_withshadow&chld=bb|${encodeURIComponent(String(i + 1))}|FF8|000`
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
      eq.marker.setMap(null)
    }
    recalculateLines()
    saveChanges()
  }

  $scope.toggle = () => {
    $scope.addingLinks = !$scope.addingLinks
  }

  function saveChanges () {
    var data = {
      from_ids: $scope.selectedEquipment.map((equipment) => equipment.from_link_id),
      to_ids: $scope.selectedEquipment.map((equipment) => equipment.to_link_id)
    }
    $http.post(`/backhaul/${$scope.plan.id}/links`, data).success((response) => {
      console.log('response', response)
    })
  }

  function center (pointFrom, pointTo) {
    var bounds = new google.maps.LatLngBounds()
    bounds.extend(pointFrom)
    bounds.extend(pointTo)
    return bounds.getCenter()
  }

  var previousFeature = null
  $rootScope.$on('map_layer_clicked_feature', (e, event, layer) => {
    if (layer.type !== 'network_nodes') return
    if (!$scope.addingLinks) return
    if (!map_tools.is_visible('backhaul')) return
    if (!event.feature.getProperty('id')) return
    if (!previousFeature) {
      previousFeature = event.feature
      return
    }
    var feature = event.feature
    var pointFrom = previousFeature.getGeometry().get()
    var pointTo = feature.getGeometry().get()
    $scope.selectedEquipment.push({
      name: '',
      line: new google.maps.Polyline({
        path: [pointFrom, pointTo],
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        map: map
      }),
      points: [pointFrom, pointTo],
      marker: new google.maps.Marker({ map: map, position: center(pointFrom, pointTo) }),
      from_link_id: previousFeature.getProperty('id'),
      to_link_id: feature.getProperty('id')
    })
    recalculateLines()
    saveChanges()
    previousFeature = null
    if (!$rootScope.$$phase) { $rootScope.$apply() }
  })

  $rootScope.$on('map_tool_changed_visibility', (e, name) => {
    if (name === 'backhaul' && map_tools.is_visible('backhaul')) {
      $scope.isEquipmentVisible = MapLayer.isEquipmentVisible()
      if (!$rootScope.$$phase) { $rootScope.$apply() }
    }
    var m = map_tools.is_visible('backhaul') ? map : null
    $scope.selectedEquipment.forEach((equipment) => {
      equipment.line.setMap(m)
      equipment.marker.setMap(m)
    })
  })

  $(document).keydown((e) => {
    if (e.keyCode === 27 && map_tools.is_visible('backhaul')) {
      $scope.selectedEquipment.forEach((equipment) => {
        var m = equipment.line.getMap() ? null : map
        equipment.line.setMap(m)
        equipment.marker.setMap(m)
      })
    }
  })
}])
