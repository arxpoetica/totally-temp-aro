/* global app */
app.controller('backhaul-controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  $scope.selectedEquipment = []
  $scope.addEquipment = () => {
    $rootScope.$broadcast('edit-backhaul')
  }
  $scope.removeEquipment = (equipment) => {
    var i = $scope.selectedEquipment.indexOf(equipment)
    if (i >= 0) {
      $scope.selectedEquipment.splice(i, 1)
    }
  }
  $rootScope.$on('map_layer_clicked_feature', (e, event, layer) => {
    if (layer.type !== 'network_nodes') return
    var id = event.feature.getProperty('id')
    var equipment = $scope.selectedEquipment.find((item) => item.id === id)
    if (equipment) return
    $scope.selectedEquipment.push({
      name: 'node',
      id: id
    })
  })
}])
