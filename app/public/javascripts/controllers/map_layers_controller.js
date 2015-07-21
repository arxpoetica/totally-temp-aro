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

  /*****************
  * FEATURE LAYERS *
  ******************/
  (function add_locations_layer() {
    var layer = new MapLayer('L', '/locations', {
      normal: {
        icon: '/images/map_icons/location_business_gray.png',
      },
      selected: {
        icon: '/images/map_icons/location_business_selected.png',
      }
    });
    layer.set_selection_action('/locations/closest_vertex/', selection.targets);
    feature_layers['locations'] = layer;
  })();

  (function add_splice_points_layer() {
    var layer = new MapLayer('SP', '/splice_points/VERIZON', {
      normal: {
        icon: '/images/map_icons/splice_point.png',
      },
      selected: {
        icon: '/images/map_icons/splice_point_selected.png',
      }
    });
    layer.set_selection_action('/splice_points/closest_vertex/', selection.sources);
    feature_layers['splice_points'] = layer;
  })();

  /**************
  * AREA LAYERS *
  ***************/
  (function add_county_subdivisions_layer() {
    var layer = new MapLayer('CS', '/county_subdivisions/53', {
      normal: {
        fillColor: 'green',
        strokeColor: 'green',
        strokeWeight: 2,
      }
    });
    area_layers['county_subdivisions_layer'] = layer;
  })();
  
});