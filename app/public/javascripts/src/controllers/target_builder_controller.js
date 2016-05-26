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
  $scope.user_id = user_id
  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
  })

  $rootScope.$on('plan_changed_metadata', (e, plan) => {
    $scope.plan = plan
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

  var budgetInput = $('#target-builder-budget input')
  var budgetButton = $('#target-builder-budget button')

  budgetInput.on('focus', () => {
    budgetInput.val(budgetInput.val().match(/\d+/g).join(''))
  })

  budgetInput.on('blur', () => {
    var num = +budgetInput.val().match(/\d+/g).join('')
    budgetInput.val(num.toLocaleString())
  })

  budgetInput.on('input', () => {
    budgetButton.removeAttr('disabled')
  })

  budgetButton.on('click', () => {
    budgetButton.attr('disabled', 'disabled')
  })

  // TODO: hide this tool if not config.route_planning
}])
