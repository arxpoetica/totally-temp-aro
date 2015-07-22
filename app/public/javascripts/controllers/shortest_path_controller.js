// Shortest Path Controller
app.controller('shortest_path_controller', ['$scope', '$rootScope', '$http', 'selection', 'MapLayer', function($scope, $rootScope, $http, selection, MapLayer) {
  // Controller instance variables
  $scope.is_visible = false;
  $scope.selection = selection;

  /************
  * FUNCTIONS *
  *************/

  // Listen for visibility toggle to be broadcast through $rootScope from other controller (map_tools_controller)
  $rootScope.$on('toggle_tool_visibility', function() {
    $scope.is_visible = !$scope.is_visible;
  });
  
  // Handles one source and many targets.
  $scope.create_route = function() {
  	var source = selection.sources.first();
  	var targets = selection.targets.join(',');
    var cost_multiplier = 200.0; // This will eventually be a user input which will vary
    var url = '/route_optimizer/shortest_path/' + source + '/' + targets + '/' + cost_multiplier

    var route = new MapLayer({
      short_name: 'RT',
      api_endpoint: url,
      style_options: {
        normal: {
          strokeColor: 'red'
        },
      },
    });
    route.show();

    if ($scope.route_layer) {
      $scope.route_layer.remove();
    }
    $scope.route_layer = route;

    $rootScope.area_layers['route'] = route;
  }

  $scope.clear_route = function() {
    selection.clear_selection();
    $scope.route_layer.clear_data();
    $scope.route_layer.hide();
  }

  var rectangle;
  $scope.draw_rectangle = function() {
    if (rectangle) {
      rectangle.setMap(null);
      rectangle = null;
      return;
    }

    var latLng = map.getCenter();
    var radius = google.maps.geometry.spherical.computeDistanceBetween(map.getBounds().getNorthEast(), map.getBounds().getSouthWest()) / 10;
    var bounds = new google.maps.Circle({center: latLng, radius: radius}).getBounds();

    // Define the rectangle and set its editable property to true.
    rectangle = new google.maps.Rectangle({
      bounds: bounds,
      editable: true,
      draggable: true
    });

    rectangle.setMap(map);
  }

  $scope.select_in_rectangle = function() {
    rectangle.setMap(null);
    $rootScope.locations_layer.select_in_bounds(rectangle.getBounds());
    $rootScope.splice_points_layer.select_in_bounds(rectangle.getBounds());
  }

}]);
