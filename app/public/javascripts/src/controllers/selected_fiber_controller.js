/* global app $ */
app.controller('selected_fiber_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  $rootScope.$on('map_layer_clicked_feature', (e, event, layer) => {
    if (!event.hasOwnProperty('feature') || !event.feature.hasOwnProperty('getProperty') ) return
	var fiberType = event.feature.getProperty('fiber_type')
    if (!fiberType) return
    var centroid = event.feature.getProperty('centroid')
    if (!centroid) return console.warn('Fiber without centroid')
    var coordinates = centroid.coordinates
    $scope.lat = coordinates[1]
    $scope.lon = coordinates[0]
    $('#selected_fiber_controller').modal('show')
    if (!$scope.$$phase) { $scope.$apply() } // refresh
  })
}])
