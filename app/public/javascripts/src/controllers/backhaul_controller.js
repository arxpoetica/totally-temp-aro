/* global app google map */
app.controller('backhaul-controller', ['$scope', '$rootScope', '$http', 'map_tools', ($scope, $rootScope, $http, map_tools) => {
  var line = null
  $rootScope.$on('plan_selected', () => {
    if (line) return line.setPath([])
    line = new google.maps.Polyline({
      path: [],
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2,
      map: map
    })
  })

  function recalculateLines () {
    line.setPath($scope.selectedEquipment.map((equipment) => equipment.point))
  }

  $scope.selectedEquipment = []
  $scope.addEquipment = () => {
    $rootScope.$broadcast('edit-backhaul')
  }

  $scope.removeEquipment = (equipment) => {
    var i = $scope.selectedEquipment.indexOf(equipment)
    if (i >= 0) {
      $scope.selectedEquipment.splice(i, 1)
    }
    recalculateLines()
  }

  $rootScope.$on('map_layer_clicked_feature', (e, event, layer) => {
    if (layer.type !== 'network_nodes') return
    if (!map_tools.is_visible('backhaul')) return
    var id = event.feature.getProperty('id')
    var equipment = $scope.selectedEquipment.find((item) => item.id === id)
    if (equipment) return
    $scope.selectedEquipment.push({
      name: 'node',
      id: id,
      point: event.feature.getGeometry().get()
    })
    recalculateLines()
    if (!$rootScope.$$phase) { $rootScope.$apply() }
  })

  $rootScope.$on('map_tool_changed_visibility', () => {
    line.setMap(map_tools.is_visible('backhaul') ? map : null)
  })
}])
