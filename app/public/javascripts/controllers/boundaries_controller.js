// Boundaries Controller
app.controller('boundaries_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', function($scope, $rootScope, $http, selection, map_tools) {

  $scope.map_tools = map_tools;
  $scope.area_layers = $rootScope.area_layers;

  $scope.selected_tool = false;
  $scope.boundaries = [];

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: false,
    polygonOptions: {
      editable: true,
    },
  });

  $rootScope.$on('map_tool_changed_visibility', function(e, tool) {
    if (!map_tools.is_visible('boundaries')) {
      drawingManager.setMap(null);
    }
  });

  $scope.route = null;

  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
    $scope.boundaries = [];
    if (!route) return;

    $http.get('/boundary/'+route.id+'/find')
      .success(function(boundaries) {
        $scope.boundaries = boundaries;
        boundaries.forEach(function(boundary) {
          var paths = [];
          boundary.geom.coordinates[0][0].forEach(function(p) {
            paths.push(new google.maps.LatLng(p[1], p[0]))
          })
          var overlay = new google.maps.Polygon({ 
              paths: paths, 
              editable: true,
          });
          boundary.overlay = overlay;
          make_boundary_editable(boundary);
        });
      });
  });

  $scope.toggle_boundary = function(boundary) {
    boundary.overlay.setMap(boundary.overlay.getMap() ? null : map);
  };

  $scope.toggle_tool = function() {
    $scope.selected_tool = !$scope.selected_tool;
    drawingManager.setMap($scope.selected_tool ? map : null);
    map.setOptions({ draggable: !$scope.selected_tool })
  };

  drawingManager.addListener('overlaycomplete', function(e) {
    var overlay = e.overlay;

    drawingManager.setDrawingMode(null);
    $scope.selected_tool = null;

    swal({
      title: "Give it a name",
      text: "How do you want to name this boundary?",
      type: "input",
      showCancelButton: true,
      closeOnConfirm: true,
      animation: "slide-from-top",
      inputPlaceholder: "Boundary name",
    }, function(name) {
      if (name === false) return false;
      var data = {
        name: name || 'Untitled boundary',
        geom: JSON.stringify(to_geo_json(overlay)),
      };

      $http.post('/boundary/'+$scope.route.id+'/create', data)
        .success(function(boundary) {
          $scope.boundaries.push(boundary);
          boundary.overlay = overlay;
          make_boundary_editable(boundary);
        });
    });
  });

  function to_geo_json(overlay) {
    var coordinates = [];
    var geo = { type: 'MultiPolygon', coordinates: [[ coordinates ]] };
    overlay.getPath().getArray().forEach(function(point) {
      coordinates.push([point.lng(), point.lat()]);
    });
    return geo;
  }

  function make_boundary_editable(boundary) {
    var overlay = boundary.overlay;

    function edit_boundary() {
      var data = {
        id: boundary.id,
        name: boundary.name,
        geom: JSON.stringify(to_geo_json(overlay)),
      };
      $http.post('/boundary/'+$scope.route.id+'/edit', data)
        .success(function(response) {
          // yay!
        });
    }

    ['set_at', 'insert_at', 'remove_at'].forEach(function(event_name) {
      overlay.getPath().addListener(event_name, edit_boundary);
    });
  }

}]);
