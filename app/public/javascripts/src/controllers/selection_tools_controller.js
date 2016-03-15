/* global app config user_id google $ map */
// Selection Tools Controller
//
// Handles display of and interaction with all layers of the map
app.controller('selection_tools_controller', ($rootScope, $scope, network_planning) => {
  $scope.selected_tool = null
  $scope.network_planning = network_planning
  $scope.available_tools = {
    '': {
      icon: 'fa fa-mouse-pointer',
      name: 'No selection'
    },
    // 'rectangle': {
    //   icon: 'glyphicon glyphicon-fullscreen',
    //   name: 'Rectangle selection tool',
    // },
    'polygon': {
      icon: 'glyphicon glyphicon-screenshot',
      name: 'Polygon selection tool'
    }
  }
  if (config.route_planning.length === 0) {
    $scope.available_tools = []
  }
  $scope.user_id = user_id
  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
  })

  $scope.isToolSelected = (name) => {
    if (network_planning.getAlgorithm()) return false
    return drawingManager.getDrawingMode() === (name || null)
  }

  $scope.setSelectedTool = (name) => {
    name = name || null
    drawingManager.oldDrawingMode = name
    network_planning.setAlgorithm(null)
    return drawingManager.setDrawingMode(name)
  }

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: false
  })

  $scope.deselect_mode = false

  drawingManager.addListener('overlaycomplete', (e) => {
    var overlay = e.overlay
    if (e.type !== drawingManager.getDrawingMode()) {
      return overlay.setMap(null)
    }
    $rootScope.$broadcast('selection_tool_' + e.type, overlay, $scope.deselect_mode)
    setTimeout(() => {
      overlay.setMap(null)
    }, 100)
  })

  $(document).ready(() => {
    drawingManager.setMap(map)
  })

  function setDrawingManagerEnabled (enabled) {
    if (enabled) {
      drawingManager.setDrawingMode(drawingManager.oldDrawingMode || null)
    } else {
      drawingManager.setDrawingMode(null)
    }
  }

  function updateSelectionTools (e) {
    $scope.deselect_mode = e.shiftKey
    setDrawingManagerEnabled(!e.ctrlKey)
    if (!$rootScope.$$phase) { $rootScope.$apply() } // refresh button state
  }

  document.addEventListener('keydown', updateSelectionTools)
  document.addEventListener('keyup', updateSelectionTools)

  if (config.route_planning.length > 0) {
    $('#network_planning_selector').popover({
      content: () => {
        return config.route_planning.map((algorithm) => algorithm.id).map((algorithm) => (
          `<p>
            <input type="radio" name="algorithm" value="${algorithm}"
              ${network_planning.getAlgorithm() && algorithm === network_planning.getAlgorithm().id ? 'checked' : ''}
              onclick="networkPlanningChanged(this.value)">
              ${network_planning.findAlgorithm(algorithm).description}
          </p>`
        )).join('')
      },
      html: true
    })
  }

  window.networkPlanningChanged = (value) => {
    network_planning.setAlgorithm(network_planning.findAlgorithm(value))
    setTimeout(() => {
      $('#network_planning_selector').click()
    }, 300)
    if (value) {
      drawingManager.setDrawingMode(null)
    }
    $scope.$apply()
  }
})
