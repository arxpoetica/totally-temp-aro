// Shortest Path Controller
app.controller('shortest_path_controller', ['$scope', '$rootScope', '$http', 'selection', 'MapLayer', function($scope, $rootScope, $http, selection, MapLayer) {
  // Controller instance variables
  $scope.is_visible = false;
  $scope.selection = selection;

  $scope.route = null;
  $scope.routes = [];

  /************
  * FUNCTIONS *
  *************/

  // Listen for visibility toggle to be broadcast through $rootScope from other controller (map_tools_controller)
  $rootScope.$on('toggle_tool_visibility', function() {
    if (!$scope.is_visible && !$scope.route) {
      return $scope.show_routes();
    }
    $scope.is_visible = !$scope.is_visible;
  });

  $scope.select_route = function(route) {
    $scope.route = route;
    $scope.is_visible = true;
    $('#select-route').modal('hide');

    $http.get('/route_optimizer/'+route.id).success(function(response) {
      redraw_route(response);
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

  $rootScope.$on('map_Layer_changed_selection', function(e, layer, changes) {
    if (!$scope.route) return;

    if (layer.type === 'locations' || layer.type === 'splice_points') {
      $http.post('/route_optimizer/'+$scope.route.id+'/edit', changes).success(function(response) {
        redraw_route(response);
      });
    }
  });

  $scope.save_changes = function() {
    $http.post('/route_optimizer/'+$scope.route.id+'/save', $scope.route).success(function(response) {
      // success
    });
  };

  $scope.clear_route = function() {
    selection.clear_selection();
    $scope.route_layer.clear_data();
    $scope.route_layer.hide();
  }

  $scope.show_routes();

}]);
