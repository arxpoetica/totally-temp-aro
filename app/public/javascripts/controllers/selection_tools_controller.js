// Selection Tools Controller
//
// Handles display of and interaction with all layers of the map
app.controller('selection_tools_controller', function($rootScope, $scope) {
  
  $scope.selected_tool = null;
  $scope.available_tools = {
    '': {
      icon: 'glyphicon glyphicon-hand-up',
      name: 'No selection',
    },
    'rectangle': {
      icon: 'glyphicon glyphicon-fullscreen',
      name: 'Rectangle selection tool',
    },
    'polygon': {
      icon: 'glyphicon glyphicon-screenshot',
      name: 'Polygon selection tool',
    },
  };

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
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.POLYGON,
        google.maps.drawing.OverlayType.RECTANGLE,
      ]
    },
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

  document.addEventListener('keydown', function(e) {
    $scope.deselect_mode = e.shiftKey;
    set_drawing_manager_enabled(!e.ctrlKey);
    if (!$rootScope.$$phase) { $rootScope.$apply(); } // refresh button state
  });

  document.addEventListener('keyup', function(e) {
    $scope.deselect_mode = e.shiftKey;
    set_drawing_manager_enabled(!e.ctrlKey);
    if (!$rootScope.$$phase) { $rootScope.$apply(); } // refresh button state
  });

});
