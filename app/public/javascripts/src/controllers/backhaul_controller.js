/* global app google map $ swal */
app.controller('backhaul-controller', ['$scope', '$rootScope', '$http', 'map_tools', 'MapLayer', ($scope, $rootScope, $http, map_tools, MapLayer) => {
  $scope.plan = null
  $scope.addingLinks = false
  $scope.isEquipmentVisible = false

  var lineSymbol = {
    path: 'M 0,-1 0,1',
    strokeOpacity: 1,
    strokeColor: '#FF0000',
    scale: 4
  }

  function cleanEquipment () {
    $scope.selectedEquipment.forEach((equipment) => {
      equipment.line.setMap(null)
      equipment.marker.setMap(null)
    })
    $scope.selectedEquipment = []
  }

  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
    cleanEquipment()
    cleanMarkers()
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
            icons: [{
              icon: lineSymbol,
              offset: '0',
              repeat: '20px'
            }],
            strokeOpacity: 0
          }),
          points: [pointFrom, pointTo],
          marker: new google.maps.Marker({ map: m, position: center(pointFrom, pointTo) }),
          from_link_id: item.from_link_id,
          to_link_id: item.to_link_id,
          serviceLayerId: item.service_layer_id
        })
      })
      recalculateLines()
    })
  })

  function recalculateLines () {
    $scope.selectedEquipment.forEach((equipment, i) => {
      equipment.name = `link ${i + 1}`
      equipment.marker.setIcon({
        anchor: new google.maps.Point(10, 45),
        url: `https://chart.googleapis.com/chart?chst=d_bubble_text_small_withshadow&chld=bb|${encodeURIComponent(String(i + 1))}|FFF|000`
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
    if (!$scope.addingLinks) cleanMarkers()
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
  var previousMarker = null
  var currentMarker = null
  var timeout
  function cleanMarkers () {
    previousMarker && previousMarker.setMap(null)
    currentMarker && currentMarker.setMap(null)
    previousMarker = null
    currentMarker = null
    previousFeature = null
    clearTimeout(timeout)
  }
  $rootScope.$on('map_layer_clicked_feature', (e, event, layer) => {
    if (layer.type !== 'network_nodes') return
    if (!$scope.addingLinks) return
    if (!map_tools.is_visible('backhaul')) return
    if (!event.feature.getProperty('id')) return
    if (!previousFeature) {
      cleanMarkers()
      previousFeature = event.feature
      previousMarker = new google.maps.Marker({
        position: previousFeature.getGeometry().get(),
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          strokeColor: '#FF0000',
          fillColor: '#FF0000',
          scale: 5
        },
        draggable: true,
        map: map
      })
      return
    }
    var feature = event.feature
    var pointFrom = previousFeature.getGeometry().get()
    var pointTo = feature.getGeometry().get()
    var serviceLayerId = feature.getProperty('service_layer_id')
    if (pointFrom === pointTo) return
    if (serviceLayerId !== event.feature.getProperty('service_layer_id')) return
    var createLink = () => {
      $scope.selectedEquipment.push({
        name: '',
        line: new google.maps.Polyline({
          path: [pointFrom, pointTo],
          icons: [{
            icon: lineSymbol,
            offset: '0',
            repeat: '20px'
          }],
          strokeOpacity: 0,
          map: map
        }),
        points: [pointFrom, pointTo],
        marker: new google.maps.Marker({ map: map, position: center(pointFrom, pointTo) }),
        from_link_id: previousFeature.getProperty('id'),
        to_link_id: feature.getProperty('id'),
        serviceLayerId: serviceLayerId
      })
      currentMarker = new google.maps.Marker({
        position: feature.getGeometry().get(),
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          strokeColor: '#FF0000',
          fillColor: '#FF0000',
          scale: 5
        },
        draggable: true,
        map: map
      })
      timeout = setTimeout(cleanMarkers, 500)
      recalculateLines()
      saveChanges()
      previousFeature = null
      if (!$rootScope.$$phase) { $rootScope.$apply() }
    }
    if ($scope.selectedEquipment.length > 0 && $scope.selectedEquipment[0].serviceLayerId !== serviceLayerId) {
      swal({
        title: 'Warning',
        text: 'You are attempting a link with equipment from a different service layer than the other links. Backhaul can only be run across one service layer. If you proceed, it will remove all previous links.',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Proceed',
        showCancelButton: true,
        closeOnConfirm: true
      }, (confirm) => {
        if (!confirm) return
        cleanEquipment()
        createLink()
      })
    } else {
      createLink()
    }
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