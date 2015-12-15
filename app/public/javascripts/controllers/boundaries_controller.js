// Boundaries Controller
app.controller('boundaries_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', 'map_utils', 'tracker', function($scope, $rootScope, $http, selection, map_tools, map_utils, tracker) {

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
    if (tool === 'boundaries' && !map_tools.is_visible('boundaries')) {
      $scope.remove_drawing_manager();
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
            editable: route.owner_id === user_id,
            strokeWeight: 2,
          });
          boundary.overlay = overlay;
          make_boundary_editable(boundary);
          update_tooltips();
        });
      });
  });

  function update_tooltips() {
    setTimeout(function() {
      var tooltips = $('[ng-controller="boundaries_controller"] [data-toggle="tooltip"]');
      tooltips.tooltip();
    }, 1); // setTimeout to wait until the DOM is rendered
  }

  $scope.toggle_boundary = function(boundary) {
    boundary.overlay.setMap(boundary.overlay.getMap() ? null : map);
  };

  $scope.toggle_tool = function() {
    $scope.selected_tool = !$scope.selected_tool;
    if ($scope.selected_tool) {
      drawingManager.setMap(map);
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
      map.setOptions({ draggable: false });
      tracker.track('Boundaries / Build');
    } else {
      $scope.remove_drawing_manager();
    }
  };

  $scope.remove_drawing_manager = function() {
    drawingManager.setDrawingMode(null);
    drawingManager.setMap(null);
    map.setOptions({ draggableCursor: null, draggable: true });
    $scope.selected_tool = null;
    // update the angular UI if this method is called for example
    // from a google maps event
    if (!$rootScope.$$phase) { $rootScope.$apply(); }
  };

  drawingManager.addListener('overlaycomplete', function(e) {
    var overlay = e.overlay;

    $scope.remove_drawing_manager();

    swal({
      title: "Give it a name",
      text: "How do you want to name this boundary?",
      type: "input",
      showCancelButton: true,
      closeOnConfirm: true,
      animation: "slide-from-top",
      inputPlaceholder: "Boundary name",
    }, function(name) {
      if (!name) {
        return overlay.setMap(null);
      }
      var data = {
        name: name || 'Untitled boundary',
        geom: JSON.stringify(to_geo_json(overlay)),
      };

      $http.post('/boundary/'+$scope.route.id+'/create', data)
        .success(function(boundary) {
          $scope.boundaries.push(boundary);
          boundary.overlay = overlay;
          make_boundary_editable(boundary);
          update_tooltips();
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
    var name = event.feature.getProperty('name');
    if (event.feature.getGeometry().getType() === 'MultiPolygon') {
      event.feature.toGeoJson(function(obj) {
        tracker.track('Boundaries / Market profile');
        $rootScope.$broadcast('boundary_selected', obj.geometry, name, 'market_size');
      });
    }
  });

  function make_boundary_editable(boundary) {
    var overlay = boundary.overlay;

    function edit_boundary() {
      tracker.track('Boundaries / Edit');
      var data = {
        name: boundary.name,
        geom: JSON.stringify(to_geo_json(overlay)),
      };
      $http.post('/boundary/'+$scope.route.id+'/edit/'+boundary.id, data)
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
      $scope.show_market_size(boundary);
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

  $scope.rename_boundary = function(boundary) {
    swal({
      title: "Give it a new name",
      text: "How do you want to name this boundary?",
      type: "input",
      showCancelButton: true,
      closeOnConfirm: true,
      animation: "slide-from-top",
      inputPlaceholder: "Boundary name",
      inputValue: boundary.name,
    }, function(name) {
      if (!name) return false;
      var data = {
        name: name || 'Untitled boundary',
        geom: JSON.stringify(to_geo_json(boundary.overlay)),
      };

      $http.post('/boundary/'+$scope.route.id+'/edit/'+boundary.id, data)
        .success(function(response) {
          boundary.name = name;
        });
    });
  };

  $scope.delete_boundary = function(boundary) {
    tracker.track('Boundaries / Delete');
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover the deleted data!",
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      showCancelButton: true,
      closeOnConfirm: true,
    }, function() {
      $http.post('/boundary/'+$scope.route.id+'/delete/'+boundary.id)
        .success(function(response) {
          boundary.overlay.setMap(null);
          $scope.boundaries = _.reject($scope.boundaries, function(b) { return boundary.id === b.id; });
        });
    });
  };

  $scope.show_market_size = function(boundary) {
    tracker.track('Boundaries / Market profile');
    $rootScope.$broadcast('boundary_selected', to_geo_json(boundary.overlay, true), boundary.name, 'market_size');
  };

  $scope.show_customer_profile = function(boundary) {
    tracker.track('Boundaries / Customer profile');
    $rootScope.$broadcast('boundary_selected', to_geo_json(boundary.overlay, true), boundary.name, 'customer_profile');
  };

  $scope.select_area = function(layer) {
    var feature;
    layer.data_layer.forEach(function(f) {
      feature = f;
    });
    if (!feature) return console.log('no feature');
    feature.toGeoJson(function(obj) {
      $rootScope.$broadcast('boundary_selected', obj.geometry, layer.name);
    });
  };

}]);
