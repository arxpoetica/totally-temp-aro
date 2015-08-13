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
    if (!route) {
      if ($scope.route_layer) {
        $scope.route_layer.remove();
      }
      $scope.route_layer = null;
      delete $rootScope.area_layers['route'];
      return;
    }

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
    $scope.route.metadata = {
      total_cost: 0,
      costs: [
        { name: 'Fiber cost', value: 0 },
        { name: 'Locations cost', value: 0 },
        { name: 'Equipment nodes cost', value: 0 },
      ],
      revenue: 0,
    };
  });

  $rootScope.$on('equipment_nodes_changed', function() {
    $http.get('/route_optimizer/'+$scope.route.id).success(function(response) {
      redraw_route(response, true);
    });
  });

  function redraw_route(data, only_metadata) {
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
    if (only_metadata) return;

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
