// Equipment Nodes Controller
app.controller('equipment_nodes_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', function($scope, $rootScope, $http, selection, map_tools) {
  // Controller instance variables
  $scope.map_tools = map_tools;
  $scope.node_type;

  $scope.show_network_nodes = true;

  $scope.toggle_network_nodes = function() {
    var layer = $rootScope.feature_layers.network_nodes;
    $scope.show_network_nodes ? layer.show() : layer.hide();
  };

  $rootScope.$on('map_tool_changed_visibility', function(e, tool) {
    if (tool === 'network_nodes') {
      $scope.toggle_network_nodes();
    }
  });

  var node_types = $scope.node_types = [];

  $http.get('/network/nodes').success(function(response) {
    response = _.reject(response, function(type) {
      return type.name === 'central_office';
    });
    node_types = $scope.node_types = response;
    $scope.node_type = response[0];
  })

  function empty_changes() {
    return { insertions: [], deletions: [], updates: [] };
  }

  var changes = empty_changes();
  $scope.route = null;

  /************
  * FUNCTIONS *
  *************/

  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
  });

  $scope.save_nodes = function() {
    $http.post('/network/nodes/'+$scope.route.id+'/edit', changes).success(function(response) {
      if (changes.insertions.length > 0 || changes.deletions.length > 0) {
        // For insertions we need to get the ids so they can be selected
        $rootScope.feature_layers.network_nodes.reload_data();
      }
      changes = empty_changes();
      $rootScope.$broadcast('equipment_nodes_changed');
    });
  };

  $scope.clear_nodes = function() {
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover the deleted data!",
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, clear them!",
      showCancelButton: true,
      closeOnConfirm: true,
    }, function() {
      $http.post('/network/nodes/'+$scope.route.id+'/clear').success(function(response) {
        $rootScope.feature_layers.network_nodes.reload_data();
      });
    });
  };

  $scope.place_random_equipment = function() {
    var gm_event = {
      latLng: new google.maps.LatLng(40.77682494132765, -73.95257949829102),
    }
    $rootScope.$broadcast('map_click', gm_event);
  };

  $scope.show_number_of_features = function() {
    $scope.number_of_features = $rootScope.feature_layers.network_nodes.number_of_features();
  };

  function update_map_cursor() {
    var layer = $rootScope.feature_layers.network_nodes;
    var editing = layer.visible && $scope.route && map_tools.is_visible('equipment_nodes');
    map.setOptions({ draggableCursor: editing ? 'crosshair' : null });
  }

  $rootScope.$on('map_layer_changed_visibility', function(e, name) {
    update_map_cursor();
  });

  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
    update_map_cursor();
  });

  $rootScope.$on('map_tool_changed_visibility', function(e, name) {
    if (name === 'equipment_nodes') {
      update_map_cursor();
    }
  });

  $rootScope.$on('map_layer_dragged_feature', function(e, gm_event, feature) {
    var coordinates = feature.getGeometry().get();
    changes.updates.push({
      lat: coordinates.lat(),
      lon: coordinates.lng(),
      id: feature.getProperty('id'),
    });
    $scope.save_nodes();
  });

  $rootScope.$on('map_click', function(e, gm_event) {
    if (!map_tools.is_visible('equipment_nodes') || !$scope.route) return;

    var type = $scope.node_type.name;
    var coordinates = gm_event.latLng;
    var feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [ coordinates.lng(), coordinates.lat() ],
      }
    };
    changes.insertions.push({
      lat: coordinates.lat(),
      lon: coordinates.lng(),
      type: _.findWhere(node_types, { name: type }).id,
    });
    var layer = $rootScope.feature_layers.network_nodes;
    var arr = layer.data_layer.addGeoJson(feature);
    arr.forEach(function(feature) {
      layer.data_layer.overrideStyle(feature, {
        icon: '/images/map_icons/'+type+'.png',
        draggable: true,
      });
    });
    layer.show();
    $scope.save_nodes();
  });

  $rootScope.$on('contextual_menu_feature', function(event, options, map_layer, feature) {
    if (map_layer.type !== 'network_nodes'
      || !map_tools.is_visible('equipment_nodes')
      || !feature.getProperty('unselectable')) {
      return;
    }
    options.add('Delete equipment node', function(map_layer, feature) {
      swal({
        title: "Are you sure?",
        text: "You will not be able to recover the deleted data!",
        type: "warning",
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, delete it!",
        showCancelButton: true,
        closeOnConfirm: true,
      }, function() {
        changes.deletions.push({
          id: feature.getProperty('id'),
        });
        $scope.save_nodes();
      });
    });
  });


}]);
