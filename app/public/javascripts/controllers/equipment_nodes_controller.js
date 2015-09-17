// Equipment Nodes Controller
app.controller('equipment_nodes_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', function($scope, $rootScope, $http, selection, map_tools) {
  // Controller instance variables
  $scope.map_tools = map_tools;
  $scope.user_id = user_id;

  $rootScope.$on('map_tool_changed_visibility', function(e, tool) {
    if (map_tools.is_visible('network_nodes')) {
      $rootScope.equipment_layers.network_nodes.show();
    } else if (tool === 'network_nodes') {
      $scope.selected_tool = null;
      map.setOptions({ draggableCursor: null });
    }
  });

  $scope.selected_tool = null;

  $scope.select_tool = function(tool) {
    if ($scope.selected_tool === tool) {
      $scope.selected_tool = null;
    } else {
      $scope.selected_tool = tool;
    }
    map.setOptions({ draggableCursor: $scope.selected_tool === null ? null : 'crosshair' });
  };

  var node_types = $scope.node_types = [];

  $http.get('/network/nodes').success(function(response) {
    response = _.reject(response, function(type) {
      return type.name === 'central_office';
    });
    node_types = $scope.node_types = response;
    node_types.forEach(function(node_type) {
      node_type.visible = true;
    });
  });

  function empty_changes() {
    return { insertions: [], deletions: [], updates: [] };
  }

  var changes = empty_changes();

  /************
  * FUNCTIONS *
  *************/

  $scope.route = null;
  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
  });

  $scope.change_node_types_visibility = function() {
    var types = ['central_office'];
    node_types.forEach(function(node_type) {
      if (node_type.visible) {
        types.push(node_type.name);
      }
    });
    if (types.length === 0) {
      $rootScope.equipment_layers.network_nodes.hide();
    } else {
      $rootScope.equipment_layers.network_nodes.show();
      $rootScope.equipment_layers.network_nodes.set_api_endpoint('/network/nodes/'+$scope.route.id+'/find?node_types='+types.join(','));
    }
  };

  $scope.save_nodes = function() {
    $http.post('/network/nodes/'+$scope.route.id+'/edit', changes).success(function(response) {
      if (changes.insertions.length > 0 || changes.deletions.length > 0) {
        // For insertions we need to get the ids so they can be selected
        $rootScope.equipment_layers.network_nodes.reload_data();
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
        $rootScope.equipment_layers.network_nodes.reload_data();
      });
    });
  };

  $scope.place_random_equipment = function() {
    var gm_event = {
      latLng: new google.maps.LatLng(40.77682494132765, -73.95257949829102),
    };
    $scope.selected_tool = node_types[0].name;
    $rootScope.$broadcast('map_click', gm_event);
  };

  $scope.show_number_of_features = function() {
    $scope.number_of_features = $rootScope.equipment_layers.network_nodes.number_of_features();
  };

  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
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
    if (!map_tools.is_visible('network_nodes') || !$scope.route || !$scope.selected_tool) return;

    var type = $scope.selected_tool;
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
    var layer = $rootScope.equipment_layers.network_nodes;
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
      || !map_tools.is_visible('network_nodes')
      || !feature.getProperty('unselectable')
      || $scope.route.owner_id !== user_id) {
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

  $scope.recalculate_network_nodes = function() {
    var data = {};
    $http.post('/network/nodes/'+$scope.route.id+'/recalc', data).success(function(response) {
      var layer = $rootScope.equipment_layers['network_nodes'];
      layer.reload_data();
      $rootScope.$broadcast('equipment_nodes_changed');
    });
  };


}]);
