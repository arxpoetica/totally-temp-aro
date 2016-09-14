/* global app user_id config map _ google swal config $ globalServiceLayers */
// Equipment Nodes Controller
app.controller('equipment_nodes_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'map_layers', 'MapLayer', '$timeout', ($scope, $rootScope, $http, map_tools, map_layers, MapLayer, $timeout) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.user_id = user_id
  $scope.ARO_CLIENT = config.ARO_CLIENT

  $scope.selected_tool = null
  $scope.vztfttp = true

  $scope.serviceLayers = []

  var fiberPlantLayer = new MapLayer({
    name: config.ui.labels.fiber,
    type: 'fiber_plant',
    short_name: 'F',
    api_endpoint: '/network/fiber_plant/current_carrier',
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

  map_layers.addEquipmentLayer(fiberPlantLayer)

  $scope.equipment_layers = map_layers.equipment_layers

  $rootScope.$on('map_tool_changed_visibility', (e, tool) => {
    if (map_tools.is_visible('network_nodes')) {
      $scope.serviceLayers.forEach((layer) => {
        layer.networkNodesLayer.show()
      })
    } else if (tool === 'network_nodes') {
      $scope.selected_tool = null
      map.setOptions({ draggableCursor: null })
    }
  })

  $rootScope.$on('route_planning_changed', () => {
    $scope.serviceLayers.forEach((layer) => {
      layer.networkNodesLayer.reloadData(true)
    })
  })

  $scope.select_tool = (tool) => {
    if ($scope.selected_tool === tool) {
      $scope.selected_tool = null
    } else {
      $scope.selected_tool = tool
    }
    map.setOptions({ draggableCursor: $scope.selected_tool === null ? null : 'crosshair' })
  }

  $(document).ready(() => {
    map.ready(() => {
      $scope.serviceLayers = JSON.parse(JSON.stringify(globalServiceLayers)) // clone
      if ($scope.serviceLayers.length > 0) {
        var layer = $scope.serviceLayers[0]
        layer.enabled = true
        $timeout(() => {
          $(`#serviceLayer${layer.id}`).addClass('in')
          $scope.serviceLayers.slice(1).forEach((layer) => {
            $(`#serviceLayer${layer.id}`).addClass('disabled')
          })
        }, 1)
      }
      $scope.serviceLayers.forEach((layer) => {
        configureServiceLayer(layer)
      })
    })
  })

  function configureServiceLayer (layer) {
    layer.showFeederFiber = false
    layer.showDistributionFiber = false

    var routeLayer = new MapLayer({
      short_name: 'RT',
      name: 'Route',
      type: 'route',
      style_options: {
        normal: {
          strokeColor: 'red'
        }
      },
      api_endpoint: `/network/fiber/:plan_id/find/${layer.id}`,
      declarativeStyles: routeStyles(layer),
      threshold: 12,
      reload: 'always'
    })
    routeLayer.hide_in_ui = true
    layer.routeLayer = routeLayer
    map_layers.addEquipmentLayer(routeLayer)

    layer.changedFiberVisibility = () => {
      routeLayer.setVisible(layer.showFeederFiber || layer.showDistributionFiber)
      routeLayer.setDeclarativeStyle(routeStyles(layer))
    }

    var networkNodesLayer = new MapLayer({
      type: 'network_nodes',
      name: 'Network Nodes',
      short_name: 'NN',
      style_options: {
        normal: {
          fillColor: 'brown',
          strokeWeight: 1,
          opacity: 0.8,
          visible: true
        },
        selected: {
          visible: true
        }
      },
      threshold: 12,
      reload: 'always',
      declarativeStyles: (feature, styles) => {
        var name = feature.getProperty('name')
        if (name) {
          styles.icon = `/images/map_icons/${config.ARO_CLIENT}/composite/${layer.name}_${name}.png`
        } else {
          styles.icon = { path: 0, scale: 3, strokeColor: 'brown' }
        }
      }
    })
    networkNodesLayer.hide_in_ui = true
    networkNodesLayer.flat_color = true
    layer.networkNodesLayer = networkNodesLayer
    map_layers.addEquipmentLayer(networkNodesLayer)

    layer.changeNodeTypesVisibility = () => {
      var types = []
      layer.nodeTypes.forEach((nodeType) => {
        if (nodeType.visible) {
          types.push(nodeType.id)
        }
      })
      if (types.length === 0) {
        networkNodesLayer.hide()
      } else {
        networkNodesLayer.show()
        networkNodesLayer.setApiEndpoint(`/network/nodes/:plan_id/find/${layer.id}`, {
          node_types: types.join(',')
        })
      }
    }
    layer.changedAvailability = function () {
      networkNodesLayer.setVisible(layer.enabled)
    }
  }

  function emptyChanges () {
    return { insertions: [], deletions: [], updates: [] }
  }

  var changes = emptyChanges()

  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
    if (!plan) {
      $scope.serviceLayers.forEach((layer) => {
        layer.networkNodesLayer.clearData()
        layer.routeLayer.clearData()
      })
      return
    }

    map.ready(() => {
      // fiberPlantLayer.show() // hidden by default
      $scope.serviceLayers.forEach((layer) => {
        layer.networkNodesLayer.reloadData()
        layer.routeLayer.reloadData()
      })
    })

    $http.get('/network_plan/' + plan.id).success((response) => {
      redrawRoute(response)
    })
  })

  $rootScope.$on('plan_cleared', () => {
    $scope.serviceLayers.forEach((layer) => {
      layer.networkNodesLayer.reloadData()
      layer.routeLayer.clearData()
    })
  })

  $scope.save_nodes = () => {
    $http.post('/network/nodes/' + $scope.plan.id + '/edit', changes).success((response) => {
      if (changes.insertions.length > 0 || changes.deletions.length > 0) {
        // For insertions we need to get the ids so they can be selected
        $scope.serviceLayers.forEach((layer) => {
          layer.networkNodesLayer.reloadData()
        })
      }
      changes = emptyChanges()
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
      type: _.findWhere(viewNodeTypes, { name: type }).id
    })
    var networkNodesLayer = $scope.serviceLayers[0].networkNodesLayer // TODO: use selected layer
    var dataLayer = networkNodesLayer.data_layer
    var arr = dataLayer.addGeoJson(feature)
    arr.forEach((feature) => {
      dataLayer.overrideStyle(feature, {
        icon: `/images/map_icons/${config.ARO_CLIENT}/${type}.png`,
        draggable: true
      })
    })
    networkNodesLayer.show()
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

  $scope.vztfttpChanged = () => {
    Object.keys($scope.equipment_layers).forEach((key) => {
      var layer = $scope.equipment_layers[key]
      layer.setVisible($scope.vztfttp)
    })
  }

  $rootScope.$on('equipment_nodes_changed', () => {
    $http.get('/network_plan/' + $scope.plan.id + '/metadata').success((response) => {
      redrawRoute(response, true)
    })
  })

  $rootScope.$on('route_planning_changed', () => {
    $http.get('/network_plan/' + $scope.plan.id).success((response) => {
      redrawRoute(response, false)
    })
  })

  $rootScope.$on('route_planning_changed', (e, response) => {
    redrawRoute(response)
  })

  function routeStyles (serviceLayer) {
    return (feature, styles) => {
      var type = feature.getProperty('fiber_type')
      if (type === 'feeder') {
        styles.strokeColor = 'blue'
        styles.strokeWeight = 4
        if (!serviceLayer.showFeederFiber) {
          styles.visible = false
        }
      } else {
        styles.strokeColor = 'red'
        styles.strokeWeight = 2
        if (!serviceLayer.showDistributionFiber) {
          styles.visible = false
        }
      }
    }
  }

  function redrawRoute (data, only_metadata) {
    if ($scope.plan && data.metadata) {
      $scope.plan.metadata = data.metadata
      $rootScope.$broadcast('plan_changed_metadata', $scope.plan)
    }
    if (only_metadata) return
    $scope.serviceLayers.forEach((layer) => {
      layer.routeLayer.reloadData()
    })

    // to calculate market size
    $rootScope.$broadcast('route_changed')
  }

  // prevent accordions from changing the URL
  var accordion = $('#serviceLayersAccordion')
  accordion.on('click', '[data-parent="#serviceLayersAccordion"]', (e) => {
    e.preventDefault()
  })
}])
