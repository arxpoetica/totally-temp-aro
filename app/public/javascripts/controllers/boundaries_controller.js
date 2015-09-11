// Boundaries Controller
app.controller('boundaries_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', 'map_utils', function($scope, $rootScope, $http, selection, map_tools, map_utils) {

  $scope.map_tools = map_tools;
  $scope.area_layers = $rootScope.area_layers;
  $scope.user_id = user_id;

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
            strokeWeight: 2,
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

  function to_geo_json(overlay, closed) {
    var coordinates = [];
    var geo = { type: 'MultiPolygon', coordinates: [[ coordinates ]] };
    overlay.getPath().getArray().forEach(function(point) {
      coordinates.push([point.lng(), point.lat()]);
    });
    if (closed) {
      coordinates.push(coordinates[0]);
    }
    return geo;
  }

  $rootScope.$on('map_layer_clicked_feature', function(e, event, layer) {
    if (event.feature.getGeometry().getType() === 'MultiPolygon') {
      event.feature.toGeoJson(function(obj) {
        $rootScope.$broadcast('boundary_selected', obj.geometry);
      });
    }
  });

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

    overlay.marker = new google.maps.Marker({
      title: boundary.name,
      map: map,
    });

    overlay.marker.addListener('click', function() {
      $('#market-size').modal('show');
      $rootScope.$broadcast('boundary_selected', to_geo_json(overlay, true));
    });

    overlay.marker.addListener('mouseover', function() {
      update_counter(1);
    });

    overlay.marker.addListener('mouseout', function() {
      update_counter(-1);
    });

    var count = 0;
    var timer = null;

    function update_counter(i) {
      count += i;
      timer && clearTimeout(timer);
      if (count > 0) {
        !overlay.marker.getMap() && overlay.marker.setMap(map);
        overlay.setOptions({
          strokeWeight: 4,
        });
      } else {
        timer = setTimeout(function() {
          overlay.marker.setMap(null);
          overlay.setOptions({
            strokeWeight: 2,
          });
        }, 250);
      }
    }

    overlay.addListener('mouseover', function() {
      overlay.setOptions({
        strokeWeight: 4,
      });

      var bounds = new google.maps.LatLngBounds();
      overlay.getPath().getArray().forEach(function(point) {
        bounds.extend(point);
      });

      overlay.marker.setPosition(bounds.getCenter());
      update_counter(1);
    });

    overlay.addListener('mouseout', function() {
      update_counter(-1);
    });
    
  }

}]);
