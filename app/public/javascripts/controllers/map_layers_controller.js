// Map Layers Controller
//
// Handles display of and interaction with all layers of the map
app.controller('map_layers_controller', function($rootScope, $http, selection, MapLayer) {
  /*********
  * LAYERS *
  **********/

  var area_layers = {};
  var feature_layers = {};

  $rootScope.area_layers = area_layers;
  $rootScope.feature_layers = feature_layers;

  // one infowindow for all layers
  var infoWindow = new google.maps.InfoWindow();
  $rootScope.infoWindow = infoWindow;

  /**************
  * WIRECENTERS *
  ***************/
  google.maps.event.addDomListener(window, 'load', function() {
    $http.get('/wirecenters').success(function(response) {
      var wirecenters = response;
      var wirecenter = wirecenters[0];
      var centroid = wirecenter.centroid;
      map.setCenter({
        lat: centroid.coordinates[1],
        lng: centroid.coordinates[0],
      });
      map.setZoom(14);

      area_layers['wirecenter'] = new MapLayer({
        short_name: 'WC',
        data: {
          'type': 'Feature',
          'geometry': wirecenter.geom,
        },
        style_options: {
          normal: {
            fillColor: 'green',
            strokeColor: 'green',
            strokeWeight: 2,
          }
        },
      });
    });
  });

  /*****************
  * FEATURE LAYERS *
  ******************/
  feature_layers['locations'] = new MapLayer({
    type: 'locations',
    short_name: 'L',
    api_endpoint: '/locations',
    style_options: {
      normal: {
        icon: '/images/map_icons/location_business_gray.png',
      },
      selected: {
        icon: '/images/map_icons/location_business_selected.png',
      }
    },
    events: {
      selected: function(feature) {
        var id = feature.getProperty('id');
        $http.get('/locations/closest_vertex/'+id).success(function(response) {
          feature.vertex_id = response.vertex_id;
          selection.targets.add(feature.vertex_id, feature);
        });
      },
      deselected: function(feature) {
        var id = feature.getProperty('id');
        selection.targets.remove(feature.vertex_id, feature);
        $rootScope.$apply();
      }
    },
  });

  feature_layers['splice_points'] = new MapLayer({
    type: 'splice_points',
    short_name: 'SP',
    api_endpoint: '/splice_points/VERIZON',
    style_options: {
      normal: {
        icon: '/images/map_icons/splice_point.png',
      },
      selected: {
        icon: '/images/map_icons/splice_point_selected.png',
      }
    },
    events: {
      selected: function(feature) {
        var id = feature.getProperty('id');
        $http.get('/splice_points/closest_vertex/'+id).success(function(response) {
          feature.vertex_id = response.vertex_id;
          selection.sources.add(feature.vertex_id, feature);
        });
      },
      deselected: function(feature) {
        var id = feature.getProperty('id');
        selection.sources.remove(feature.vertex_id, feature);
        $rootScope.$apply();
      }
    },
  });

  /**************
  * AREA LAYERS *
  ***************/
  area_layers['county_subdivisions_layer'] = new MapLayer({
    short_name: 'CS',
    api_endpoint: '/county_subdivisions/53',
    style_options: {
      normal: {
        fillColor: 'green',
        strokeColor: 'green',
        strokeWeight: 2,
      }
    },
  });

  var events = [
    'bounds_changed',
    'center_changed',
    'click',
    'dblclick',
    'drag',
    'dragend',
    'dragstart',
    'heading_changed',
    'idle',
    'maptypeid_changed',
    'mousemove',
    'mouseout',
    'mouseover',
    'projection_changed',
    'resize',
    'rightclick',
    'tilesloaded',
    'tilt_changed',
    'zoom_changed',
  ];

  google.maps.event.addDomListener(window, 'load', function() {
    events.forEach(function(eventName) {
      google.maps.event.addListener(map, eventName, function(event) {
        $rootScope.$broadcast('map_'+eventName, event);
      });
    });
  });

  area_layers['fiber_plant'] = new MapLayer({
    short_name: 'FB',
    api_endpoint: '/equipment/VERIZON',
    style_options: {
      normal: {
        strokeColor: 'red',
        strokeWeight: 2,
      }
    },
  });

});
