// Selection Tools Controller
//
// Handles display of and interaction with all layers of the map
app.controller('selection_tools_controller', function($rootScope, $scope, network_planning) {

  $scope.selected_tool = null;
  $scope.available_tools = {
    '': {
      icon: 'fa fa-mouse-pointer',
      name: 'No selection',
    },
    // 'rectangle': {
    //   icon: 'glyphicon glyphicon-fullscreen',
    //   name: 'Rectangle selection tool',
    // },
    'polygon': {
      icon: 'glyphicon glyphicon-screenshot',
      name: 'Polygon selection tool',
    },
  };
  if (config.route_planning.length === 0) {
    $scope.available_tools = [];
  }
  $scope.user_id = user_id;
  $scope.route = null;
  $rootScope.$on('route_selected', (e, route) => $scope.route = route);

  $scope.is_selected_tool = function(name) {
    return drawingManager.getDrawingMode() === (name ? name : null);
  };

  $scope.get_selected_tool = function() {
    return drawingManager.getDrawingMode();
  };

  $scope.set_selected_tool = function(name) {
    name = name ? name : null;
    drawingManager.old_drawing_mode = name;
    return drawingManager.setDrawingMode(name);
  };

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: false,
  });

  $scope.deselect_mode = false;

  drawingManager.addListener('overlaycomplete', function(e) {
    var overlay = e.overlay;
    if (e.type !== drawingManager.getDrawingMode()) {
      return overlay.setMap(null);
    }
    $rootScope.$broadcast('selection_tool_'+e.type, overlay, $scope.deselect_mode);
    setTimeout(function() {
      overlay.setMap(null);
    }, 100);
  });

  $(document).ready(function() {
    drawingManager.setMap(map);
  });

  function set_drawing_manager_enabled(enabled) {
    if (enabled) {
      drawingManager.setDrawingMode(drawingManager.old_drawing_mode || null);
    } else {
      drawingManager.setDrawingMode(null);
    }
  }

  function update_selection_tools(e) {
    $scope.deselect_mode = e.shiftKey;
    set_drawing_manager_enabled(!e.ctrlKey);
    if (!$rootScope.$$phase) { $rootScope.$apply(); } // refresh button state
  }

  document.addEventListener('keydown', update_selection_tools);
  document.addEventListener('keyup', update_selection_tools);

  if (config.route_planning.length > 0) {
    var descriptions = {
      'fttp': 'FTTP',
      'shortest_path': 'Shortest path',
    };
    $('#network_planning_selector').popover({
      content: function() {
        return config.route_planning.map((algorithm) => (
          `<p>
            <input type="radio" name="algorithm" value="${algorithm}"
              ${algorithm === network_planning.getAlgorithm() ? 'checked' : ''}
              onclick="network_planning_changed(this.value)">
              ${descriptions[algorithm]}
          </p>`
        )).join('');
      },
      html: true,
    });
  }

  window.network_planning_changed = function(value) {
    network_planning.setAlgorithm(value);
  };

});
