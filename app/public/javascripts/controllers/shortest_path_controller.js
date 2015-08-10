// Shortest Path Controller
app.controller('shortest_path_controller', ['$scope', '$rootScope', '$http', 'selection', 'MapLayer', 'map_tools', function($scope, $rootScope, $http, selection, MapLayer, map_tools) {
  // Controller instance variables
  $scope.map_tools = map_tools;
  $scope.selection = selection;

  $scope.route = null;

  $scope.always_shows_sources = true;
  $scope.always_shows_targets = true;

  /************
  * FUNCTIONS *
  *************/

  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;

    $rootScope.feature_layers.network_nodes.set_always_show_selected($scope.always_shows_sources);
    $rootScope.feature_layers.locations.set_always_show_selected($scope.always_shows_targets);

    $http.get('/route_optimizer/'+route.id).success(function(response) {
      redraw_route(response);
      selection.set_enabled(true);
      if ((response.metadata.sources || []).length > 0) {
        $rootScope.feature_layers.network_nodes.show();
      }
    });
  });

  $rootScope.$on('route_cleared', function(e, route) {
    selection.clear_selection();
    $scope.route_layer.clear_data();
    $scope.route.metadata = {};
  });

  function redraw_route(data) {
    if (data.metadata) {
      $scope.route.metadata = data.metadata;

      selection.clear_selection();

      (data.metadata.targets || []).forEach(function(id) {
        selection.targets.add(id);
      });
      (data.metadata.sources || []).forEach(function(id) {
        selection.sources.add(id);
      });

      selection.sync_selection();
    }
    var route = new MapLayer({
      short_name: 'RT',
      data: data.feature_collection,
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

  $rootScope.$on('map_layer_changed_selection', function(e, layer, changes) {
    if (!$scope.route) return;

    if (layer.type === 'locations' || layer.type === 'network_nodes') {
      $http.post('/route_optimizer/'+$scope.route.id+'/edit', changes).success(function(response) {
        redraw_route(response);
      });
    }
  });

  $scope.toggle_always_show_sources = function() {
    $rootScope.feature_layers.network_nodes.set_always_show_selected($scope.always_shows_sources);
  };

  $scope.toggle_always_show_targets = function() {
    $rootScope.feature_layers.locations.set_always_show_selected($scope.always_shows_targets);
  };

}]);
