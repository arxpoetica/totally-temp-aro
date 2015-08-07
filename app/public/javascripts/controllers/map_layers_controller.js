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
  // google.maps.event.addDomListener(window, 'load', callback) does not work on integration tests for some reason
  area_layers['wirecenter'] = new MapLayer({
    short_name: 'WC',
    name: 'Wirecenter',
    style_options: {
      normal: {
        fillColor: 'green',
        strokeColor: 'green',
        strokeWeight: 2,
      }
    },
  });

  $(document).ready(function() { // we need to wait until de map is ready
    $http.get('/wirecenters/NYCMNY79').success(function(response) {
      var wirecenters = response;
      var wirecenter = wirecenters[0];
      var centroid = wirecenter.centroid;
      map.setCenter({
        lat: centroid.coordinates[1],
        lng: centroid.coordinates[0],
      });
      map.setZoom(14);
      area_layers['wirecenter'].load_data({
        'type': 'Feature',
        'geometry': wirecenter.geom,
      });
    });
  });

  /*****************
  * FEATURE LAYERS *
  ******************/
  feature_layers['locations'] = new MapLayer({
    type: 'locations',
    name: 'Locations',
    short_name: 'L',
    api_endpoint: '/locations',
    style_options: {
      normal: {
        icon: '/images/map_icons/location_business_gray.png',
        visible: true,
      },
      selected: {
        icon: '/images/map_icons/location_business_selected.png',
        visible: true,
      }
    },
    heatmap: true,
  });

  feature_layers['network_nodes'] = new MapLayer({
    type: 'network_nodes',
    name: 'Central offices',
    short_name: 'CO',
    api_endpoint: '/network/nodes/central_office',
    style_options: {
      normal: {
        icon: '/images/map_icons/central_office.png',
        visible: true,
      },
      selected: {
        icon: '/images/map_icons/central_office_selected.png',
        visible: true,
      }
    },
  });

  $rootScope.$on('selection_tool_rectangle', function(e, bounds) {
    feature_layers.locations.toggle_features_in_bounds(bounds);
  });

  /**************
  * AREA LAYERS *
  ***************/
  area_layers['county_subdivisions_layer'] = new MapLayer({
    short_name: 'CS',
    name: 'County subdivisions layer',
    api_endpoint: '/county_subdivisions/36',
    style_options: {
      normal: {
        fillColor: 'green',
        strokeColor: 'green',
        strokeWeight: 2,
      }
    },
  });

  area_layers['census_blocks_layer'] = new MapLayer({
    type: 'census_blocks',
    short_name: 'CB',
    name: 'Census Blocks layer',
    api_endpoint: '/census_blocks/36/061',
    style_options: {
      normal: {
        fillColor: 'blue',
        strokeColor: 'blue',
        strokeWeight: 2,
      },
      highlight: {
        fillColor: 'blue',
        strokeColor: 'blue',
        strokeWeight: 5,
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
    'mousedown',
    'mouseup',
  ];

  google.maps.event.addDomListener(window, 'load', function() {
    events.forEach(function(eventName) {
      google.maps.event.addListener(map, eventName, function(event) {
        $rootScope.$broadcast('map_'+eventName, event);
      });
    });
  });

  area_layers['fiber_plant'] = new MapLayer({
    name: 'Fiber plant',
    short_name: 'FB',
    api_endpoint: '/network/fiber_plant/VERIZON',
    style_options: {
      normal: {
        strokeColor: 'red',
        strokeWeight: 2,
      }
    },
  });

  $rootScope.$on('route_selected', function(e, route) {
    feature_layers.network_nodes.load_data('/network/nodes/'+route.id+'/find');
  });

});
