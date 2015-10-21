// Map Layers Controller
//
// Handles display of and interaction with all layers of the map
app.controller('map_layers_controller', function($rootScope, $http, selection, MapLayer) {
  /*********
  * LAYERS *
  **********/

  var area_layers = {};
  var feature_layers = {};
  var equipment_layers = {};

  $rootScope.area_layers = area_layers;
  $rootScope.feature_layers = feature_layers;
  $rootScope.equipment_layers = equipment_layers;

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
    // api_endpoint: '/locations',
    style_options: {
      normal: {
        icon: '/images/map_icons/location_business_gray.png',
        visible: true,
        fillColor: 'blue',
        strokeColor: 'blue',
        strokeWeight: 1,
      },
      selected: {
        icon: '/images/map_icons/location_business_selected.png',
        visible: true,
      },
    },
    threshold: 15,
    reload: 'always',
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
    api_endpoint: '/wirecenters',
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
    reload: 'always',
    threshold: 0,
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
    reload: 'always',
    threshold: 0,
  });

  area_layers['census_blocks_layer'] = new MapLayer({
    type: 'census_blocks',
    short_name: 'CB',
    name: 'Census Blocks',
    api_endpoint: '/census_blocks/36/061',
    highlighteable: true,
    single_selection: true,
    reset_style_on_click: true,
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
    threshold: 13,
    reload: 'dynamic',
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

  equipment_layers['network_nodes'] = new MapLayer({
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

  equipment_layers['fiber_plant'] = new MapLayer({
    name: 'Fiber',
    short_name: 'F',
    // api_endpoint: '/network/fiber_plant/VERIZON',
    style_options: {
      normal: {
        strokeColor: 'red',
        strokeWeight: 2,
        fillColor: 'red',
      }
    },
    threshold: 11,
    reload: 'always',
  });

  $rootScope.$on('route_selected', function(e, route) {
    var layer = equipment_layers.network_nodes;
    var api_endpoint = route ? '/network/nodes/'+route.id+'/find' : '/network/nodes/central_office';
    layer.set_api_endpoint(api_endpoint);

    var layer = feature_layers['locations'];
    layer.set_api_endpoint('/locations/'+route.id);

    var layer = equipment_layers['fiber_plant'];
    layer.set_api_endpoint('/network/fiber_plant/'+route.carrier_name);
    map.ready(function() {
      layer.show();
    })

    if (route) {
      $http.get('/network_plan/'+route.id+'/area_data')
        .success(function(response) {
          // area_layers['wirecenter'].set_api_endpoint('/wirecenters/'+response.wirecenter);
          area_layers['county_subdivisions_layer'].set_api_endpoint('/county_subdivisions/'+response.statefp);
          area_layers['census_blocks_layer'].set_api_endpoint('/census_blocks/'+response.statefp+'/'+response.countyfp);
        });
    }
  });

  var lastTime = null;

  $rootScope.$on('map_idle', function() {
    if (lastTime) {
      console.log('It took', Date.now() - lastTime, 'ms', 'to zoom');
      lastTime = null;
    }
  });

  $rootScope.$on('map_zoom_changed', function() {
    lastTime = Date.now();
  });


});
