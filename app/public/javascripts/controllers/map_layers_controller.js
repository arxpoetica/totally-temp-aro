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

  /*****************
  * FEATURE LAYERS *
  ******************/
  feature_layers['locations'] = new MapLayer({
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
      rightclick: function(feature) {
        var id = feature.getProperty('id');
        $http.get('/locations/house_hold_summary/' + id).success(function(response) {
          var number_of_households = response.number_of_households || 0;
          var install_cost_per_hh = response.install_cost_per_hh || 0;
          var annual_recurring_cost_per_hh = response.annual_recurring_cost_per_hh || 0;

          var position = feature.getGeometry().get();
          infoWindow.setContent('<p>Number of households: '+number_of_households+'</p>');
          infoWindow.setPosition(position);
          infoWindow.open(map);
        });
      },
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

});