// Shortest Path Controller
app.controller('shortest_path_controller', ['$scope', '$rootScope', '$http', 'selection', 'MapLayer', 'map_tools', function($scope, $rootScope, $http, selection, MapLayer, map_tools) {
  // Controller instance variables
  $scope.map_tools = map_tools;
  $scope.selection = selection;

  $scope.route = null;
  $scope.routes = [];

  $scope.always_shows_sources = true;
  $scope.always_shows_targets = true;

  /************
  * FUNCTIONS *
  *************/

  $rootScope.$on('map_tool_changed_visibility', function(e, tool) {
    if (tool === 'route' && !$scope.route) {
      $scope.show_routes();
    }
  });

  $scope.select_route = function(route) {
    $scope.route = route;
    map_tools.show('route');
    $('#select-route').modal('hide');

    $rootScope.feature_layers.network_nodes.set_always_show_selected($scope.always_shows_sources);
    $rootScope.feature_layers.locations.set_always_show_selected($scope.always_shows_targets);

    $http.get('/route_optimizer/'+route.id).success(function(response) {
      redraw_route(response);
      selection.set_enabled(true);
      if ((response.metadata.sources || []).length > 0) {
        $rootScope.feature_layers.network_nodes.show();
      }
    });
  };

  $scope.create_route = function() {
    $http.post('/route_optimizer/create').success(function(response) {
      $scope.select_route(response);
    });
  };

  $scope.delete_route = function(route) {
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover the deleted route!",
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      showCancelButton: true,
      closeOnConfirm: true,
    }, function() {
      $http.post('/route_optimizer/'+route.id+'/delete').success(function(response) {
        $scope.show_routes();
      });
    });
  };

  $scope.show_routes = function() {
    $http.get('/route_optimizer/find_all').success(function(response) {
      $scope.routes = response;
    });
    $('#select-route').modal('show');
  };

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

  $scope.save_changes = function() {
    $http.post('/route_optimizer/'+$scope.route.id+'/save', $scope.route).success(function(response) {
      // success
    });
  };

  $scope.clear_route = function() {
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover the deleted data!",
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, clear it!",
      showCancelButton: true,
      closeOnConfirm: true,
    }, function() {
      selection.clear_selection();
      $scope.route_layer.clear_data();
      $scope.route.metadata = { total_cost: 0 };
      $http.post('/route_optimizer/'+$scope.route.id+'/clear').success(function(response) {
        // success
      });
    });
  }

}]);
