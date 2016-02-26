// Route Controller
app.controller('route_controller', ['$scope', '$rootScope', '$http', 'selection', 'MapLayer', 'map_tools', 'map_layers', 'network_planning', function($scope, $rootScope, $http, selection, MapLayer, map_tools, map_layers, network_planning) {
  // Controller instance variables
  $scope.map_tools = map_tools;
  $scope.selection = selection;

  $scope.plan = null;

  /************
  * FUNCTIONS *
  *************/

  $rootScope.$on('plan_selected', function(e, plan) {
    $scope.plan = plan;
    if (!plan) {
      $scope.route_layer = null;
      map_layers.removeEquipmentLayer('route');
      return;
    }

    $http.get('/network_plan/'+plan.id).success(function(response) {
      redraw_route(response);
      selection.set_enabled(plan.owner_id === user_id);
      if ((response.metadata.sources || []).length > 0) {
        map_layers.getEquipmentLayer('network_nodes').show();
      }
    });
  });

  $rootScope.$on('plan_cleared', function(e, plan) {
    selection.clear_selection();
    $scope.route_layer.clear_data();
    $scope.plan.metadata = {
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
    $http.get('/network_plan/'+$scope.plan.id+'/metadata').success(function(response) {
      redraw_route(response, true);
    });
  });

  $rootScope.$on('route_planning_changed', function() {
    $http.get('/network_plan/'+$scope.plan.id).success(function(response) {
      redraw_route(response, false);
    });
  });

  function redraw_route(data, only_metadata) {
    if ($scope.plan && data.metadata) {
      $scope.plan.metadata = data.metadata;
      $rootScope.$broadcast('plan_changed_metadata', $scope.plan);
      if (only_metadata) return;

      if (config.route_planning.length > 0) {
        selection.clear_selection();

        (data.metadata.targets || []).forEach(function(id) {
          selection.targets.add(id);
        });
        (data.metadata.sources || []).forEach(function(id) {
          selection.sources.add(id);
        });

        selection.sync_selection();
      }
    }

    if (config.route_planning.length > 0) {
      var route = new MapLayer({
        short_name: 'RT',
        name: 'Route',
        type: 'route',
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
      map_layers.addEquipmentLayer(route);
    }

    // to calculate market size
    $rootScope.$broadcast('route_changed');
  }

  $rootScope.$on('map_layer_changed_selection', function(e, layer, changes) {
    if (!$scope.route) return;
    if (!network_planning.getAlgorithm()) return;
    changes.algorithm = network_planning.getAlgorithm().id;

    if (layer.type === 'locations' || layer.type === 'network_nodes') {
      var url = '/network_plan/'+$scope.route.id+'/edit'
      var config = {
        url: url,
        method: 'post',
        saving_plan: true,
        data: changes,
      }
      $http(config).success(function(response) {
        redraw_route(response);
      });
    }
  });

}]);
