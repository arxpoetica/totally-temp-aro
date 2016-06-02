/* global app user_id google $ map */
// Search Controller
app.controller('target-builder-controller', ['$scope', '$rootScope', '$http', 'map_tools', ($scope, $rootScope, $http, map_tools) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.optimizationType = 'capex'
  $scope.selectedTool = 'single'
  $scope.modes = {
    'single': null,
    'polygon': 'polygon'
  }
  $scope.budget = 10000000
  $scope.discountRate = 0.2
  $scope.npvType = 'targeted'
  $scope.user_id = user_id
  $scope.plan = null
  const planChanged = (e, plan) => {
    $scope.plan = plan
    checkBudget()
  }
  $rootScope.$on('plan_selected', planChanged)
  $rootScope.$on('plan_changed_metadata', planChanged)

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
  var budgetButton = $('#target-builder-budget button')

  budgetInput.val($scope.budget.toLocaleString())

  const parseBudget = () => +budgetInput.val().match(/\d+/g).join('') || 0

  budgetInput.on('focus', () => {
    budgetInput.val(String(parseBudget()))
  })

  budgetInput.on('blur', () => {
    budgetInput.val(parseBudget().toLocaleString())
  })

  budgetInput.on('input', () => {
    budgetButton.removeAttr('disabled')
  })

  budgetButton.on('click', () => {
    $scope.budget = parseBudget()
    budgetButton.attr('disabled', 'disabled')
    checkBudget()
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
      layer.type !== 'network_nodes' &&
      layer.type !== 'towers') return

    postChanges(changes)
  })

  function postChanges (changes) {
    changes.algorithm = $scope.optimizationType.toUpperCase()
    if ($scope.optimizationType === 'npv') {
      if ($scope.npvType === 'targeted') {
        changes.budget = $scope.budget
        changes.discountRate = $scope.discountRate
      }
    }

    var url = '/network_plan/' + $scope.plan.id + '/edit'
    var config = {
      url: url,
      method: 'post',
      saving_plan: true,
      data: changes
    }
    $http(config).success((response) => {
      $rootScope.$broadcast('route_planning_changed', response)
    })
  }

  $scope.optimizationTypeChanged = () => {
    postChanges({})
  }

  // TODO: hide this tool if not config.route_planning
}])
