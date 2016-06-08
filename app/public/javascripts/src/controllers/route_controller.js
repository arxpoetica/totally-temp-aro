/* global app user_id config */
// Route Controller
app.controller('route_controller', ['$scope', '$rootScope', '$http', 'selection', 'MapLayer', 'map_tools', 'map_layers', ($scope, $rootScope, $http, selection, MapLayer, map_tools, map_layers) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.selection = selection

  $scope.plan = null

  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
    if (!plan) {
      $scope.route_layer = null
      map_layers.removeEquipmentLayer('route')
      return
    }

    $http.get('/network_plan/' + plan.id).success((response) => {
      redrawRoute(response)
      selection.set_enabled(plan.owner_id === user_id)
      if ((response.metadata.sources || []).length > 0) {
        map_layers.getEquipmentLayer('network_nodes').show()
      }
    })
  })

  $rootScope.$on('plan_cleared', (e, plan) => {
    selection.clearSelection()
    $scope.route_layer.clearData()
    $scope.plan.metadata = {
      total_cost: 0,
      costs: [
        { name: 'Fiber cost', value: 0 },
        { name: 'Locations cost', value: 0 },
        { name: 'Equipment nodes cost', value: 0 }
      ],
      revenue: 0
    }
  })

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

  function redrawRoute (data, only_metadata) {
    if ($scope.plan && data.metadata) {
      $scope.plan.metadata = data.metadata
      $rootScope.$broadcast('plan_changed_metadata', $scope.plan)
    }
    if (only_metadata) return

    if (config.route_planning.length > 0) {
      var route = new MapLayer({
        short_name: 'RT',
        name: 'Route',
        type: 'route',
        data: data.feature_collection,
        style_options: {
          normal: {
            strokeColor: 'red'
          }
        },
        declarativeStyles: (feature, styles) => {
          if (feature.getProperty('fiber_type') === 'feeder') {
            styles.strokeColor = 'red'
          } else {
            styles.strokeColor = 'blue'
          }
        }
      })
      route.hide_in_ui = true
      route.show()
      if ($scope.route_layer) {
        $scope.route_layer.remove()
      }
      $scope.route_layer = route
      map_layers.addEquipmentLayer(route)
    }

    // to calculate market size
    $rootScope.$broadcast('route_changed')
  }
}])
