/* global $ app user_id swal _ google map config */
// Boundaries Controller
app.controller('boundaries_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'map_utils', 'map_layers', 'MapLayer', 'tracker', 'network_planning', ($scope, $rootScope, $http, map_tools, map_utils, map_layers, MapLayer, tracker, network_planning) => {
  $scope.map_tools = map_tools
  $scope.user_id = user_id

  $scope.selected_tool = false
  $scope.boundaries = []

  var area_layers = $scope.area_layers = {}

  if (config.ui.map_tools.boundaries.view.indexOf('wirecenters') >= 0) {
    area_layers['wirecenter'] = new MapLayer({
      short_name: 'WC',
      name: 'Wirecenter',
      type: 'wirecenter',
      api_endpoint: '/wirecenters',
      highlighteable: true,
      style_options: {
        normal: {
          fillColor: 'green',
          strokeColor: 'green',
          strokeWeight: 2
        },
        highlight: {
          fillColor: 'green',
          strokeColor: 'green',
          strokeWeight: 4
        }
      },
      reload: 'always',
      threshold: 0
    })
  }

  if (config.ui.map_tools.boundaries.view.indexOf('county_subdivisions') >= 0) {
    area_layers['county_subdivisions_layer'] = new MapLayer({
      short_name: 'CS',
      name: 'County Subdivisions',
      type: 'county_subdivisions_layer',
      api_endpoint: '/county_subdivisions/36',
      highlighteable: true,
      style_options: {
        normal: {
          fillColor: 'green',
          strokeColor: 'green',
          strokeWeight: 2
        },
        highlight: {
          fillColor: 'green',
          strokeColor: 'green',
          strokeWeight: 2
        }
      },
      reload: 'always',
      threshold: 0
    })
  }

  if (config.ui.map_tools.boundaries.view.indexOf('county_subdivisions') >= 0) {
    area_layers['census_blocks_layer'] = new MapLayer({
      type: 'census_blocks',
      short_name: 'CB',
      name: 'Census Blocks',
      api_endpoint: '/census_blocks/36/061',
      highlighteable: true,
      single_selection: true,
      reset_style_on_click: true,
      style_options: {
        normal: {
          fillColor: 'blue',
          strokeColor: 'blue',
          strokeWeight: 2
        },
        highlight: {
          fillColor: 'blue',
          strokeColor: 'blue',
          strokeWeight: 4
        },
        selected: {
          fillColor: 'blue',
          strokeColor: 'blue',
          strokeWeight: 4
        }
      },
      threshold: 13,
      reload: 'dynamic'
    })
  }

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: false,
    polygonOptions: {
      editable: true
    }
  })

  $rootScope.$on('map_tool_changed_visibility', (e, tool) => {
    if (tool === 'boundaries' && !map_tools.is_visible('boundaries')) {
      $scope.remove_drawing_manager()
    }
  })

  $scope.plan = null

  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
    $scope.boundaries = []
    if (!plan) return

    var county_subdivisions = area_layers['county_subdivisions_layer']
    var census_blocks = area_layers['census_blocks_layer']

    if (plan && (county_subdivisions || census_blocks)) {
      $http.get(`/network_plan/${plan.id}/area_data`)
        .success((response) => {
          area_layers['county_subdivisions_layer'].setApiEndpoint('/county_subdivisions/' + response.statefp)
          area_layers['census_blocks_layer'].setApiEndpoint(`/census_blocks/${response.statefp}/${response.countyfp}`)
        })
    }

    $http.get('/boundary/' + plan.id + '/find')
      .success((boundaries) => {
        $scope.boundaries = boundaries
        boundaries.forEach((boundary) => {
          var paths = []
          boundary.geom.coordinates[0][0].forEach((p) => {
            paths.push(new google.maps.LatLng(p[1], p[0]))
          })
          var overlay = new google.maps.Polygon({
            paths: paths,
            editable: plan.owner_id === user_id,
            strokeWeight: 2
          })
          boundary.overlay = overlay
          make_boundary_editable(boundary)
          update_tooltips()
        })
      })
  })

  function update_tooltips () {
    setTimeout(() => {
      var tooltips = $('[ng-controller="boundaries_controller"] [data-toggle="tooltip"]')
      tooltips.tooltip()
    }, 1) // setTimeout to wait until the DOM is rendered
  }

  $scope.toggle_boundary = (boundary) => {
    boundary.overlay.setMap(boundary.overlay.getMap() ? null : map)
  }

  $scope.toggle_tool = () => {
    $scope.selected_tool = !$scope.selected_tool
    if ($scope.selected_tool) {
      drawingManager.setMap(map)
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON)
      map.setOptions({ draggable: false })
      tracker.track('Boundaries / Build')
    } else {
      $scope.remove_drawing_manager()
    }
  }

  $scope.remove_drawing_manager = () => {
    drawingManager.setDrawingMode(null)
    drawingManager.setMap(null)
    map.setOptions({ draggableCursor: null, draggable: true })
    $scope.selected_tool = null
    // update the angular UI if this method is called for example
    // from a google maps event
    if (!$rootScope.$$phase) { $rootScope.$apply() }
  }

  drawingManager.addListener('overlaycomplete', (e) => {
    var overlay = e.overlay

    $scope.remove_drawing_manager()

    swal({
      title: 'Give it a name',
      text: 'How do you want to name this boundary?',
      type: 'input',
      showCancelButton: true,
      closeOnConfirm: true,
      animation: 'slide-from-top',
      inputPlaceholder: 'Boundary name'
    }, (name) => {
      if (!name) {
        return overlay.setMap(null)
      }
      var data = {
        name: name || 'Untitled boundary',
        geom: JSON.stringify(to_geo_json(overlay))
      }

      $http.post('/boundary/' + $scope.plan.id + '/create', data)
        .success((boundary) => {
          $scope.boundaries.push(boundary)
          boundary.overlay = overlay
          make_boundary_editable(boundary)
          update_tooltips()
        })
    })
  })

  function to_geo_json (overlay, closed) {
    var coordinates = []
    var geo = { type: 'MultiPolygon', coordinates: [[ coordinates ]] }
    overlay.getPath().getArray().forEach((point) => {
      coordinates.push([point.lng(), point.lat()])
    })
    if (closed) {
      coordinates.push(coordinates[0])
    }
    return geo
  }

  $rootScope.$on('map_layer_clicked_feature', (e, event, layer) => {
    var name = event.feature.getProperty('name')
    if (event.feature.getGeometry().getType() === 'MultiPolygon') {
      event.feature.toGeoJson((obj) => {
        if (network_planning.getAlgorithm()) {
          tracker.track('Boundaries / Network planning')
          $scope.network_planning_boundary(obj.geometry)
        } else {
          tracker.track('Boundaries / Market profile')
          $rootScope.$broadcast('boundary_selected', obj.geometry, name, 'market_size')
        }
      })
    }
  })

  function make_boundary_editable (boundary) {
    var overlay = boundary.overlay

    function edit_boundary () {
      tracker.track('Boundaries / Edit')
      var data = {
        name: boundary.name,
        geom: JSON.stringify(to_geo_json(overlay))
      }
      $http.post('/boundary/' + $scope.plan.id + '/edit/' + boundary.id, data)
        .success((response) => {
          // yay!
        })
    }

    ;['set_at', 'insert_at', 'remove_at'].forEach((event_name) => {
      overlay.getPath().addListener(event_name, edit_boundary)
    })

    overlay.marker = new google.maps.Marker({
      title: boundary.name,
      map: map
    })

    overlay.marker.addListener('click', () => {
      if (map_tools.is_visible('network_planning')) {
        $scope.run_network_planning(boundary)
      } else {
        $scope.show_market_size(boundary)
      }
    })

    overlay.marker.addListener('mouseover', () => {
      update_counter(1)
    })

    overlay.marker.addListener('mouseout', () => {
      update_counter(-1)
    })

    var count = 0
    var timer = null

    function update_counter (i) {
      count += i
      timer && clearTimeout(timer)
      if (count > 0) {
        !overlay.marker.getMap() && overlay.marker.setMap(map)
        overlay.setOptions({
          strokeWeight: 4
        })
      } else {
        timer = setTimeout(() => {
          overlay.marker.setMap(null)
          overlay.setOptions({
            strokeWeight: 2
          })
        }, 250)
      }
    }

    overlay.addListener('mouseover', () => {
      overlay.setOptions({
        strokeWeight: 4
      })

      var bounds = new google.maps.LatLngBounds()
      overlay.getPath().getArray().forEach((point) => {
        bounds.extend(point)
      })

      overlay.marker.setPosition(bounds.getCenter())
      update_counter(1)
    })

    overlay.addListener('mouseout', () => {
      update_counter(-1)
    })
  }

  $scope.rename_boundary = (boundary) => {
    swal({
      title: 'Give it a new name',
      text: 'How do you want to name this boundary?',
      type: 'input',
      showCancelButton: true,
      closeOnConfirm: true,
      animation: 'slide-from-top',
      inputPlaceholder: 'Boundary name',
      inputValue: boundary.name
    }, (name) => {
      if (!name) return false
      var data = {
        name: name || 'Untitled boundary',
        geom: JSON.stringify(to_geo_json(boundary.overlay))
      }

      $http.post('/boundary/' + $scope.plan.id + '/edit/' + boundary.id, data)
        .success((response) => {
          boundary.name = name
        })
    })
  }

  $scope.network_planning_boundary = (geojson) => {
    var data = {
      boundary: geojson,
      algorithm: network_planning.getAlgorithm().id
    }
    var config = {
      url: '/network/nodes/' + $scope.plan.id + '/select_boundary',
      method: 'post',
      saving_plan: true,
      data: data
    }
    $http(config).success((response) => {
      $rootScope.$broadcast('route_planning_changed')
    })
  }

  $scope.deleteBoundary = (boundary) => {
    tracker.track('Boundaries / Delete')
    swal({
      title: 'Are you sure?',
      text: 'You will not be able to recover the deleted data!',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it!',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      $http.post('/boundary/' + $scope.plan.id + '/delete/' + boundary.id)
        .success((response) => {
          boundary.overlay.setMap(null)
          $scope.boundaries = _.reject($scope.boundaries, (b) => boundary.id === b.id)
        })
    })
  }

  $scope.run_network_planning = (boundary) => {
    tracker.track('Boundaries / Network planning')
    $scope.network_planning_boundary(to_geo_json(boundary.overlay, true))
  }

  $scope.show_market_size = (boundary) => {
    tracker.track('Boundaries / Market profile')
    $rootScope.$broadcast('boundary_selected', to_geo_json(boundary.overlay, true), boundary.name, 'market_size')
  }

  $scope.show_customer_profile = (boundary) => {
    tracker.track('Boundaries / Customer profile')
    $rootScope.$broadcast('boundary_selected', to_geo_json(boundary.overlay, true), boundary.name, 'customer_profile')
  }

  $scope.select_area = (layer) => {
    var feature
    layer.data_layer.forEach((f) => {
      feature = f
    })
    if (!feature) return console.log('no feature')
    feature.toGeoJson((obj) => {
      $rootScope.$broadcast('boundary_selected', obj.geometry, layer.name)
    })
  }

  $scope.number_of_area_layers = () => {
    return _.size(area_layers)
  }
}])
