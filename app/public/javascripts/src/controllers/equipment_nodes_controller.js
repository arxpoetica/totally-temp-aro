// Equipment Nodes Controller
app.controller('equipment_nodes_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', 'map_layers', 'MapLayer', 'network_planning', function($scope, $rootScope, $http, selection, map_tools, map_layers, MapLayer, network_planning) {
  // Controller instance variables
  $scope.map_tools = map_tools;
  $scope.user_id = user_id;

  $scope.selected_tool = null;
  $scope.show_clear_nodes = config.ui.map_tools.equipment.actions.indexOf('clear') >= 0;

  var network_nodes_layer = new MapLayer({
    type: 'network_nodes',
    name: 'Network Nodes',
    short_name: 'NN',
    api_endpoint: '/network/nodes/central_office',
    style_options: {
      normal: {
        icon: '/images/map_icons/central_office.png',
        visible: true,
      },
      selected: {
        icon: '/images/map_icons/central_office_selected.png',
        visible: true,
      }
    },
  });
  network_nodes_layer.hide_in_ui = true;

  var fiber_plant_layer = new MapLayer({
    name: 'Fiber',
    type: 'fiber_plant',
    short_name: 'F',
    api_endpoint: '/network/fiber_plant/:client_carrier_name',
    style_options: {
      normal: {
        strokeColor: config.ui.colors.fiber,
        strokeWeight: 2,
        fillColor: config.ui.colors.fiber,
      }
    },
    threshold: 11,
    reload: 'always',
  });

  var towers_layer = new MapLayer({
    name: 'Towers',
    type: 'towers',
    short_name: 'T',
    api_endpoint: '/network/towers',
    style_options: {
      normal: {
        icon: '/images/map_icons/tower.png',
        visible: true,
      },
    },
    threshold: 8,
    reload: 'always',
  });

  map_layers.addEquipmentLayer(network_nodes_layer);
  map_layers.addEquipmentLayer(fiber_plant_layer);

  $scope.equipment_layers = map_layers.equipment_layers;

  $rootScope.$on('map_tool_changed_visibility', function(e, tool) {
    if (map_tools.is_visible('network_nodes')) {
      network_nodes_layer.show();
    } else if (tool === 'network_nodes') {
      $scope.selected_tool = null;
      map.setOptions({ draggableCursor: null });
    }
  });

  $scope.select_tool = function(tool) {
    if ($scope.selected_tool === tool) {
      $scope.selected_tool = null;
    } else {
      $scope.selected_tool = tool;
    }
    map.setOptions({ draggableCursor: $scope.selected_tool === null ? null : 'crosshair' });
  };

  $scope.view_node_types = [];
  $scope.build_node_types = [];

  $http.get('/network/nodes').success(function(response) {
    response.forEach(function(node_type) {
      node_type.visible = true;
    });
    $scope.view_node_types = _.reject(response, function(type) {
      return config.ui.map_tools.equipment.view.indexOf(type.name) === -1;
    });
    $scope.build_node_types = _.reject(response, function(type) {
      return config.ui.map_tools.equipment.build.indexOf(type.name) === -1;
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
    if (!route) return;

    map.ready(function() {
      fiber_plant_layer.show();
    });
  });


  $scope.change_node_types_visibility = function() {
    var types = [];
    $scope.view_node_types.forEach(function(node_type) {
      if (node_type.visible) {
        types.push(node_type.name);
      }
    });
    if (types.length === 0) {
      network_nodes_layer.hide();
    } else {
      network_nodes_layer.show();
      network_nodes_layer.set_api_endpoint('/network/nodes/'+$scope.route.id+'/find?node_types='+types.join(','));
    }
  };

  $scope.save_nodes = function() {
    $http.post('/network/nodes/'+$scope.route.id+'/edit', changes).success(function(response) {
      if (changes.insertions.length > 0 || changes.deletions.length > 0) {
        // For insertions we need to get the ids so they can be selected
        network_nodes_layer.reload_data();
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
        network_nodes_layer.reload_data();
      });
    });
  };

  $scope.place_random_equipment = function() {
    var gm_event = {
      latLng: new google.maps.LatLng(40.77682494132765, -73.95257949829102),
    };
    $scope.selected_tool = $scope.build_node_types[0].name;
    $rootScope.$broadcast('map_click', gm_event);
  };

  $scope.show_number_of_features = function() {
    $scope.number_of_features = network_nodes_layer.number_of_features();
  };

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
      type: _.findWhere($scope.view_node_types, { name: type }).id,
    });
    var data_layer = network_nodes_layer.data_layer;
    var arr = data_layer.addGeoJson(feature);
    arr.forEach(function(feature) {
      data_layer.overrideStyle(feature, {
        icon: '/images/map_icons/'+type+'.png',
        draggable: true,
      });
    });
    network_nodes_layer.show();
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

}]);
