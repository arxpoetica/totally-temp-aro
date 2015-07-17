// Map Layers Controller
//
// Handles display of and interaction with all layers of the map
app.controller('map_layers_controller', function($rootScope, $http, sources, targets, MapLayer) {
  /*********
  * LAYERS *
  **********/

  $rootScope.county_subdivisions_layer = new MapLayer('/county_subdivisions/53', map, {
    normal: {
      fillColor: 'green',
      strokeColor: 'green',
      strokeWeight: 2,
    }
  });
  
  $rootScope.locations_layer = new MapLayer('/locations', map, {
    normal: {
      icon: '/images/map_icons/location_business_gray.png',
    },
    selected: {
      icon: '/images/map_icons/location_business_selected.png',
    }
  });
  $rootScope.locations_layer.set_selection_action('/locations/closest_vertex/', targets);

  $rootScope.splice_points_layer = new MapLayer('/splice_points/VERIZON', map, {
    normal: {
      icon: '/images/map_icons/splice_point.png',
    },
    selected: {
      icon: '/images/map_icons/splice_point_selected.png',
    }
  });
  $rootScope.splice_points_layer.set_selection_action('/splice_points/closest_vertex/', sources);

});