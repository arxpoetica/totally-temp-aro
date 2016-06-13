/* global app user_id config map _ google swal config */
// Equipment Nodes Controller
app.controller('equipment_nodes_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'map_layers', 'MapLayer', ($scope, $rootScope, $http, map_tools, map_layers, MapLayer) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.user_id = user_id
  $scope.ARO_CLIENT = config.ARO_CLIENT
  $scope.showFeederFiber = true
  $scope.showDistributionFiber = true

  $scope.selected_tool = null

  var network_nodes_layer = new MapLayer({
    type: 'network_nodes',
    name: 'Network Nodes',
    short_name: 'NN',
    style_options: {
      normal: {
        visible: true
      },
      selected: {
        visible: true
      }
    },
    declarativeStyles: (feature, styles) => {
      styles.icon = `/images/map_icons/${config.ARO_CLIENT}/${feature.getProperty('name')}.png`
    }

  })
  network_nodes_layer.hide_in_ui = true

  var fiber_plant_layer = new MapLayer({
    name: config.ui.labels.fiber,
    type: 'fiber_plant',
    short_name: 'F',
    api_endpoint: '/network/fiber_plant/:client_carrier_name',
    style_options: {
      normal: {
        strokeColor: config.ui.colors.fiber,
        strokeWeight: 2,
        fillColor: config.ui.colors.fiber
      }
    },
    threshold: 11,
    reload: 'always'
  })

  map_layers.addEquipmentLayer(network_nodes_layer)
  map_layers.addEquipmentLayer(fiber_plant_layer)

  $scope.equipment_layers = map_layers.equipment_layers

  $rootScope.$on('map_tool_changed_visibility', (e, tool) => {
    if (map_tools.is_visible('network_nodes')) {
      network_nodes_layer.show()
    } else if (tool === 'network_nodes') {
      $scope.selected_tool = null
      map.setOptions({ draggableCursor: null })
    }
  })

  $rootScope.$on('route_planning_changed', () => {
    network_nodes_layer.reloadData(true)
  })

  $scope.select_tool = (tool) => {
    if ($scope.selected_tool === tool) {
      $scope.selected_tool = null
    } else {
      $scope.selected_tool = tool
    }
    map.setOptions({ draggableCursor: $scope.selected_tool === null ? null : 'crosshair' })
  }

  $scope.view_node_types = []
  $scope.build_node_types = []

  $http.get('/network/nodes').success((response) => {
    response.forEach((node_type) => {
      node_type.visible = true
    })
    $scope.view_node_types = _.reject(response, (type) => {
      return config.ui.map_tools.equipment.view.indexOf(type.name) === -1
    })
    $scope.build_node_types = _.reject(response, (type) => {
      return config.ui.map_tools.equipment.build.indexOf(type.name) === -1
    })
    map.ready(() => {
      $scope.change_node_types_visibility()
    })
  })

  function empty_changes () {
    return { insertions: [], deletions: [], updates: [] }
  }

  var changes = empty_changes()

  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
    if (!plan) return

    map.ready(() => {
      fiber_plant_layer.show()
      network_nodes_layer.reloadData()
    })
  })

  $rootScope.$on('plan_cleared', () => {
    network_nodes_layer.reloadData()
  })

  $scope.change_node_types_visibility = () => {
    var types = []
    $scope.view_node_types.forEach((node_type) => {
      if (node_type.visible) {
        types.push(node_type.name)
      }
    })
    if (types.length === 0) {
      network_nodes_layer.hide()
    } else {
      network_nodes_layer.show()
      network_nodes_layer.setApiEndpoint('/network/nodes/:plan_id/find', {
        node_types: types.join(',')
      })
    }
  }

  $scope.save_nodes = () => {
    $http.post('/network/nodes/' + $scope.plan.id + '/edit', changes).success((response) => {
      if (changes.insertions.length > 0 || changes.deletions.length > 0) {
        // For insertions we need to get the ids so they can be selected
        network_nodes_layer.reloadData()
      }
      changes = empty_changes()
      $rootScope.$broadcast('equipment_nodes_changed')
    })
  }

  $scope.place_random_equipment = () => {
    var gm_event = {
      latLng: new google.maps.LatLng(40.77682494132765, -73.95257949829102)
    }
    $scope.selected_tool = $scope.build_node_types[0].name
    $rootScope.$broadcast('map_click', gm_event)
  }

  $scope.show_number_of_features = () => {
    $scope.number_of_features = network_nodes_layer.number_of_features()
  }

  $rootScope.$on('map_layer_dragged_feature', (e, gm_event, feature) => {
    var coordinates = feature.getGeometry().get()
    changes.updates.push({
      lat: coordinates.lat(),
      lon: coordinates.lng(),
      id: feature.getProperty('id')
    })
    $scope.save_nodes()
  })

  $rootScope.$on('map_click', (e, gm_event) => {
    if (!map_tools.is_visible('network_nodes') || !$scope.plan || !$scope.selected_tool) return

    var type = $scope.selected_tool
    var coordinates = gm_event.latLng
    var feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [ coordinates.lng(), coordinates.lat() ]
      }
    }
    changes.insertions.push({
      lat: coordinates.lat(),
      lon: coordinates.lng(),
      type: _.findWhere($scope.view_node_types, { name: type }).id
    })
    var data_layer = network_nodes_layer.data_layer
    var arr = data_layer.addGeoJson(feature)
    arr.forEach((feature) => {
      data_layer.overrideStyle(feature, {
        icon: `/images/map_icons/${config.ARO_CLIENT}/${type}.png`,
        draggable: true
      })
    })
    network_nodes_layer.show()
    $scope.save_nodes()
  })

  $rootScope.$on('contextual_menu_feature', (event, options, map_layer, feature) => {
    if (map_layer.type !== 'network_nodes' ||
      !map_tools.is_visible('network_nodes') ||
      !feature.getProperty('unselectable') ||
      $scope.plan.owner_id !== user_id) {
      return
    }
    options.add('Delete equipment node', (map_layer, feature) => {
      swal({
        title: 'Are you sure?',
        text: 'You will not be able to recover the deleted data!',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes, delete it!',
        showCancelButton: true,
        closeOnConfirm: true
      }, () => {
        changes.deletions.push({
          id: feature.getProperty('id')
        })
        $scope.save_nodes()
      })
    })
  })

  $scope.changedFiberVisibility = () => {
    var routeLayer = map_layers.getEquipmentLayer('route')
    if (!$scope.showFeederFiber && !$scope.showDistributionFiber) {
      routeLayer.hide()
    } else {
      routeLayer.setDeclarativeStyle((feature, styles) => {
        if (feature.getProperty('fiber_type') === 'feeder') {
          styles.strokeColor = 'blue'
          styles.strokeWeight = 4
          if (!$scope.showDistributionFiber) {
            styles.visible = false
          }
        } else {
          styles.strokeColor = 'red'
          styles.strokeWeight = 2
          if (!$scope.showFeederFiber) {
            styles.visible = false
          }
        }
      })
      routeLayer.show()
    }
  }
}])
