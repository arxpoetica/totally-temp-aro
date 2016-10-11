/* global app user_id google $ map FormData XMLHttpRequest swal */
// Search Controller
app.controller('target-builder-controller', ['$scope', '$rootScope', '$http', 'map_tools', 'map_layers', '$timeout', 'optimization', ($scope, $rootScope, $http, map_tools, map_layers, $timeout, optimization) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.selectedTool = null
  $scope.modes = {
    'single': null,
    'polygon': 'polygon'
  }
  $scope.user_id = user_id
  $scope.plan = null
  $scope.locationsHeatmap = false
  $scope.showHeatmapAlert = false
  $scope.targets = []
  $scope.targetsTotal = 0

  $rootScope.$on('map_layer_loaded_data', (e, layer) => {
    if (layer.type !== 'locations') return
    $scope.locationsHeatmap = layer.heatmapLayer && layer.heatmapLayer.getMap()
    calculateShowHeatmap()
  })

  function calculateShowHeatmap () {
    $scope.showHeatmapAlert = $scope.locationsHeatmap && ($scope.selectedTool === 'single' || $scope.selectedTool === 'polygon')
  }

  function loadTargets () {
    $http.get(`/locations/${$scope.plan.id}/targets`)
      .success((response) => {
        $scope.targets = response.targets
        $scope.targetsTotal = response.total
        if ($scope.targetsTotal > 0) optimization.setMode('targets')
      })
  }

  function planChanged (e, plan) {
    $scope.plan = plan
    if (!plan) return
    loadTargets()
  }
  $rootScope.$on('plan_selected', planChanged)

  $rootScope.$on('map_tool_changed_visibility', (e, tool) => {
    if (tool === 'target_builder') {
      // $scope.setSelectedTool('single')
      drawingManager.setMap(map_tools.is_visible('target_builder') ? map : null)
    }
  })

  $scope.isToolSelected = (name) => {
    return $scope.selectedTool === name
  }

  $scope.setSelectedTool = (name) => {
    if (name) {
      $scope.selectedTool = name
      drawingManager.oldDrawingMode = name
      drawingManager.setDrawingMode($scope.modes[name])
    } else {
      $scope.selectedTool = null
      drawingManager.oldDrawingMode = null
      drawingManager.setDrawingMode(null)
    }
    calculateShowHeatmap()
  }

  $scope.toggleSelectedTool = (name) => {
    if ($scope.selectedTool !== name) {
      $scope.setSelectedTool(name)
    } else {
      $scope.setSelectedTool(null)
    }
  }

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: false
  })

  $scope.deselectMode = false

  drawingManager.addListener('overlaycomplete', (e) => {
    var overlay = e.overlay
    if (e.type !== drawingManager.getDrawingMode()) {
      return overlay.setMap(null)
    }
    $rootScope.$broadcast('selection_tool_' + e.type, overlay, $scope.deselectMode)
    setTimeout(() => {
      overlay.setMap(null)
    }, 100)
  })

  $(document).ready(() => drawingManager.setMap(map))

  function setDrawingManagerEnabled (enabled) {
    if (enabled) {
      drawingManager.setDrawingMode(drawingManager.oldDrawingMode || null)
    } else {
      drawingManager.setDrawingMode(null)
    }
  }

  function updateSelectionTools (e) {
    $scope.deselectMode = e.shiftKey
    setDrawingManagerEnabled(!e.ctrlKey)
    if (!$rootScope.$$phase) { $rootScope.$apply() } // refresh button state
  }

  document.addEventListener('keydown', updateSelectionTools)
  document.addEventListener('keyup', updateSelectionTools)

  $('#target-builder-upload input').change(() => {
    $scope.setSelectedTool(null)
    var form = $('#target-builder-upload').get(0)
    var formData = new FormData(form)
    var xhr = new XMLHttpRequest()
    xhr.open('POST', `/network/nodes/${$scope.plan.id}/csvIds`, true)
    xhr.addEventListener('error', (err) => {
      form.reset()
      console.log('error', err)
      swal('Error', err.message, 'error')
    })
    xhr.addEventListener('load', function (e) {
      form.reset()
      try {
        var data = JSON.parse(this.responseText)
      } catch (e) {
        console.log(e, e)
        return swal('Error', 'Unexpected response from server', 'error')
      }
      if (this.status !== 200) {
        return swal('Error', data.error || 'Unknown error', 'error')
      }
      swal('File processed', `Locations selected: ${data.found}, not found: ${data.notFound}, errors: ${data.errors}`, 'info')
      map_layers.getFeatureLayer('locations').reloadData()
      map_layers.getFeatureLayer('selected_locations').reloadData()
      $scope.pendingPost = true
    })
    xhr.send(formData)
  })

  $scope.search_results = null

  var marker
  var search = $('#map-tools-target-builder .select2')

  function configureBusinessesSearch () {
    search.select2({
      ajax: {
        url: '/search/businesses',
        dataType: 'json',
        delay: 250,
        data: (term) => ({ text: term }),
        results: (data, params) => {
          var items = data.map((location) => {
            return {
              id: String(location.id),
              text: location.name,
              geog: location.centroid
            }
          })
          $scope.search_results = items

          return {
            results: items,
            pagination: {
              more: false
            }
          }
        },
        cache: true
      }
    })

    search.on('change', function (e) {
      var location = e.added
      if (!location) return
      var center = { lat: location.geog.coordinates[1], lng: location.geog.coordinates[0] }
      map.setCenter(center)
      if (marker) marker.setMap(null)

      marker = new google.maps.Marker({
        position: center,
        map: map,
        animation: google.maps.Animation.DROP
      })

      google.maps.event.addListener(marker, 'click', (event) => {
        $rootScope.$broadcast('open_location', location.id)
      })
    })

    $rootScope.$on('plan_selected', (e, plan) => {
      if (marker) marker.setMap(null)
      search.select2('val', '')
    })
  }

  $timeout(configureBusinessesSearch)

  $scope.deleteTarget = (target) => {
    var config = {
      url: `/locations/${$scope.plan.id}/targets/delete`,
      method: 'post',
      data: {
        locationId: target.id
      }
    }
    $http(config)
      .success((response) => {
        $scope.targets = response.targets
        $scope.targetsTotal = response.total
        if ($scope.targetsTotal > 0) optimization.setMode('targets')
      })
  }

  $rootScope.$on('map_layer_changed_selection', (e, layer, changes) => {
    if (!$scope.plan) return

    if (layer.type !== 'locations' &&
      layer.type !== 'selected_locations' &&
      layer.type !== 'network_nodes' &&
      layer.type !== 'towers') return

    postChanges(changes, true)
    optimization.setMode('targets')
  })

  function postChanges (changes) {
    changes.lazy = true
    optimization.optimize($scope.plan, changes, loadTargets, () => {})
  }

  $scope.optimizationMode = optimization.getMode()
  $rootScope.$on('optimization_mode_changed', (e, mode) => {
    $scope.optimizationMode = mode
    if (mode !== 'targets') {
      var config = {
        url: `/locations/${$scope.plan.id}/targets/delete_all`,
        method: 'post',
        data: {}
      }
      $http(config)
        .success((response) => {
          $scope.targets = response.targets
          $scope.targetsTotal = response.total
        })
    }
  })
}])
