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
    name: 'Network Nodes',
    short_name: 'NN',
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

  $rootScope.$on('selection_tool_rectangle', function(e, overlay, deselect_mode) {
    var bounds = overlay.getBounds();
    feature_layers.locations.change_selection_for_features_matching(!deselect_mode, function(feature) {
      var latLng = feature.getGeometry().get();
      return bounds.contains(latLng);
    });
  });

  $rootScope.$on('selection_tool_polygon', function(e, overlay, deselect_mode) {
    feature_layers.locations.change_selection_for_features_matching(!deselect_mode, function(feature) {
      var latLng = feature.getGeometry().get();
      return google.maps.geometry.poly.containsLocation(latLng, overlay);
    });
  });

  /**************
  * AREA LAYERS *
  ***************/
  area_layers['wirecenter'] = new MapLayer({
    short_name: 'WC',
    name: 'Wirecenter',
    api_endpoint: '/wirecenters/NYCMNY79',
    highlighteable: true,
    style_options: {
      normal: {
        fillColor: 'green',
        strokeColor: 'green',
        strokeWeight: 2,
      },
      highlight: {
        fillColor: 'green',
        strokeColor: 'green',
        strokeWeight: 4,
      },
    },
  });

  area_layers['county_subdivisions_layer'] = new MapLayer({
    short_name: 'CS',
    name: 'County Subdivisions',
    api_endpoint: '/county_subdivisions/36',
    highlighteable: true,
    style_options: {
      normal: {
        fillColor: 'green',
        strokeColor: 'green',
        strokeWeight: 2,
      },
      highlight: {
        fillColor: 'green',
        strokeColor: 'green',
        strokeWeight: 2,
      },
    },
  });

  area_layers['census_blocks_layer'] = new MapLayer({
    type: 'census_blocks',
    short_name: 'CB',
    name: 'Census Blocks',
    api_endpoint: '/census_blocks/36/061',
    highlighteable: true,
    single_selection: true,
    style_options: {
      normal: {
        fillColor: 'blue',
        strokeColor: 'blue',
        strokeWeight: 2,
      },
      highlight: {
        fillColor: 'blue',
        strokeColor: 'blue',
        strokeWeight: 4,
      },
      selected: {
        fillColor: 'blue',
        strokeColor: 'blue',
        strokeWeight: 4,
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
    name: 'Fiber',
    short_name: 'F',
    api_endpoint: '/network/fiber_plant/VERIZON',
    style_options: {
      normal: {
        strokeColor: 'red',
        strokeWeight: 2,
      }
    },
  });

  $rootScope.$on('route_selected', function(e, route) {
    var layer = feature_layers.network_nodes;
    var api_endpoint = route ? '/network/nodes/'+route.id+'/find' : '/network/nodes/central_office';
    layer.set_api_endpoint(api_endpoint);
  });

});
