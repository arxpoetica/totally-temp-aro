// Selection Tools Controller
//
// Handles display of and interaction with all layers of the map
app.controller('selection_tools_controller', function($rootScope, $scope) {
  
  $scope.selected_tool = null;
  $scope.available_tools = {
    'SELECTION_TOOL_RECTANGLE': {
      icon: 'glyphicon glyphicon-fullscreen',
      name: 'Rectangle selection tool',
    },
  };
  var rectangle = null;
  var rectangleStart = null;
  var rectangleEnd = null;

  $scope.toggle_tool = function(tool) {
    if (tool === 'SELECTION_TOOL_RECTANGLE') {
      if ($scope.selected_tool === tool) {
        $scope.selected_tool = null;
        map.setOptions({ draggable: true, draggableCursor: null });
        if (rectangle) {
          rectangle.setMap(null);
          rectangle = null;
        }
      } else {
        $scope.selected_tool = 'SELECTION_TOOL_RECTANGLE';
        map.setOptions({ draggable: false, draggableCursor:'crosshair' });
      }
    }
  }

  function get_bounds_between_points(start, end) {
    var bounds = new google.maps.LatLngBounds();
    bounds.extend(start);
    bounds.extend(end);
    return bounds;
  }

  function mouse_move(event) {
    rectangleEnd = event.latLng;
    rectangle.setBounds(get_bounds_between_points(rectangleStart, rectangleEnd));
  }

  function mouse_up(event) {
    $rootScope.$broadcast('selection_tool_rectangle', rectangle.getBounds());
    rectangle.setMap(null);
    rectangle = null;
  }

  $rootScope.$on('map_mousedown', function(e, event) {
    if ($scope.selected_tool === 'SELECTION_TOOL_RECTANGLE') {
      rectangleStart = event.latLng;
      rectangleEnd = rectangleStart;

      rectangle = new google.maps.Rectangle({
        bounds: get_bounds_between_points(rectangleStart, rectangleEnd),
      });
      rectangle.setMap(map);

      google.maps.event.addListener(rectangle, 'mousemove', mouse_move);
      google.maps.event.addListener(rectangle, 'mouseup', mouse_up);
    }
  });

  $rootScope.$on('map_mouseup', function(e, event) {
    if ($scope.selected_tool === 'SELECTION_TOOL_RECTANGLE' && rectangle) {
      mouse_up(event);
    }
  });

  $rootScope.$on('map_mousemove', function(e, event) {
    if ($scope.selected_tool === 'SELECTION_TOOL_RECTANGLE' && rectangle) {
      mouse_move(event);
    }
  });

  $rootScope.$on('map_layer_mouseover_feature', function(e, event) {
    if ($scope.selected_tool === 'SELECTION_TOOL_RECTANGLE' && rectangle) {
      mouse_move(event);
    }
  });

  $rootScope.$on('map_layer_mouseup_feature', function(e, event) {
    if ($scope.selected_tool === 'SELECTION_TOOL_RECTANGLE' && rectangle) {
      mouse_up(event);
    }
  });

});
