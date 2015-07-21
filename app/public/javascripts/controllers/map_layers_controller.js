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
    selection_endpoint: '/locations/closest_vertex/',
    collection: selection.targets,
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
    selection_endpoint: '/splice_points/closest_vertex/',
    collection: selection.sources,
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
