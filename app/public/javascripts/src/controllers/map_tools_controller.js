// Map Tools Controller
app.controller('map_tools_controller', ['$scope', '$rootScope', 'map_tools', function($scope, $rootScope, map_tools) {

  $scope.map_tools = map_tools;

  $rootScope.$on('map_zoom_changed', function() {
    if (map.getZoom() < 11) {
      map_tools.disable('locations');
      map_tools.disable('fiber_plant');
    } else {
      map_tools.enable('locations');
      map_tools.enable('fiber_plant');
    }
  });

}]);
