/* global app $ */
// Equipment Nodes Controller
app.controller('selected_fiber_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  $rootScope.$on('map_layer_clicked_feature', (e, event, layer) => {
    var centroid = event.feature.getProperty('centroid')
    var coordinates = centroid.coordinates
    $scope.lat = coordinates[1]
    $scope.lon = coordinates[0]
    $('#selected_fiber_controller').modal('show')
    if (!$scope.$$phase) { $scope.$apply() } // refresh
  })
}])
