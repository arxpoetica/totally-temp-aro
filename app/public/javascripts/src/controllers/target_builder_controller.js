/* global app user_id google $ map FormData XMLHttpRequest swal _ */
// Search Controller
app.controller('target-builder-controller', ['$scope', '$rootScope', '$http', 'map_tools', 'map_layers', ($scope, $rootScope, $http, map_tools, map_layers) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.optimizationType = 'unconstrained'
  $scope.selectedTool = 'single'
  $scope.modes = {
    'single': null,
    'polygon': 'polygon'
  }
  $scope.budget = 10000000
  $scope.discountRate = 2
  $scope.npvType = 'targeted'
  $scope.user_id = user_id
  $scope.plan = null

  const planChanged = (e, plan) => {
    $scope.plan = plan
    checkBudget()
  }
  $rootScope.$on('plan_selected', planChanged)
  $rootScope.$on('plan_changed_metadata', planChanged)

  $rootScope.$on('map_tool_changed_visibility', (e, tool) => {
    if (tool === 'target_builder') {
      $scope.setSelectedTool('single')
      drawingManager.setMap(map_tools.is_visible('target_builder') ? map : null)
    }
  })

  $scope.isToolSelected = (name) => {
    return $scope.selectedTool === name
  }

  $scope.setSelectedTool = (name) => {
    $scope.selectedTool = name
    drawingManager.oldDrawingMode = name
    drawingManager.setDrawingMode($scope.modes[name])
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

  var budgetInput = $('#target-builder-budget input[name=budget]')
  // var discountInput = $('#target-builder-budget input[name=discount_rate]')
  var updateButton = $('#target-builder-budget button')

  budgetInput.val($scope.budget.toLocaleString())

  const parseBudget = () => +budgetInput.val().match(/\d+/g).join('') || 0

  budgetInput.on('focus', () => {
    budgetInput.val(String(parseBudget()))
  })

  budgetInput.on('blur', () => {
    budgetInput.val(parseBudget().toLocaleString())
  })

  // budgetInput.on('input', () => {
  //   updateButton.removeAttr('disabled')
  // })
  //
  // discountInput.on('input', () => {
  //   updateButton.removeAttr('disabled')
  // })

  updateButton.on('click', () => {
    $scope.budget = parseBudget()
    checkBudget()
    postChanges({}, false)
  })

  const checkBudget = () => {
    if ($scope.plan && $scope.plan.metadata) {
      $scope.overbugdet = $scope.plan.metadata.total_cost > $scope.budget
      if (!$rootScope.$$phase) { $rootScope.$apply() } // if triggered by a jquery event
    }
  }

  $rootScope.$on('map_layer_changed_selection', (e, layer, changes) => {
    if (!$scope.plan) return

    if (layer.type !== 'locations' &&
      layer.type !== 'selected_locations' &&
      layer.type !== 'network_nodes' &&
      layer.type !== 'towers') return

    postChanges(changes, true)
  })

  function postChanges (changes, lazy) {
    changes.algorithm = $scope.optimizationType.toUpperCase()
    changes.selectionMode = 'SELECTED_LOCATIONS'
    if ($scope.optimizationType === 'npv') {
      if ($scope.npvType === 'targeted') {
        changes.budget = $scope.budget
        changes.discountRate = $scope.discountRate / 100
      }
    }

    var locationTypes = map_layers.getFeatureLayer('locations').shows
    if (map_layers.getFeatureLayer('towers').visible) locationTypes = locationTypes.concat('towers')
    changes.locationTypes = locationTypes
    changes.lazy = !!lazy

    var url = '/network_plan/' + $scope.plan.id + '/edit'
    var config = {
      url: url,
      method: 'post',
      saving_plan: true,
      data: changes
    }
    updateButton.attr('disabled', 'disabled')
    $http(config).success((response) => {
      updateButton.removeAttr('disabled')
      $rootScope.$broadcast('route_planning_changed', response)
      $scope.pendingPost = lazy
    }).error(() => {
      updateButton.removeAttr('disabled')
    })
  }

  $scope.postChanges = postChanges

  $scope.optimizationTypeChanged = () => postChanges({}, false)
  $scope.npvTypeChanged = () => postChanges({}, false)

  // $rootScope.$on('locations_layer_changed', () => postChanges({}, false))
  // $rootScope.$on('towers_layer_changed', () => postChanges({}, false))

  $('#target-builder-upload input').change(() => {
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

  // TODO: hide this tool if not config.route_planning
}])
