// Map Layers Controller
//
// Handles display of and interaction with all layers of the map
app.controller('map_layers_controller', function($scope, $http, sources, targets, MapLayer) {
  /*********
  * LAYERS *
  **********/

  $scope.county_subdivisions_layer = new MapLayer('/county_subdivisions/53', map, {
    normal: {
      fillColor: 'green',
      strokeColor: 'green',
      strokeWeight: 2,
    }
  });
  
  $scope.locations_layer = new MapLayer('/locations', map, {
    normal: {
      icon: '/images/map_icons/location_business_gray.png',
    },
    selected: {
      icon: '/images/map_icons/location_business_selected.png',
    }
  });
  $scope.locations_layer.set_selection_action('/locations/closest_vertex/', targets);

  $scope.splice_points_layer = new MapLayer('/splice_points/VERIZON', map, {
    normal: {
      icon: '/images/map_icons/splice_point.png',
    },
    selected: {
      icon: '/images/map_icons/splice_point_selected.png',
    }
  });
  $scope.splice_points_layer.set_selection_action('/splice_points/closest_vertex/', sources);

});