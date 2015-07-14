// Map Layers Controller
//
// Handles display of and interaction with all layers of the map
app.controller('map_layers_controller', function($scope, $http, sources, targets, MapLayer) {
  /*********
  * LAYERS *
  **********/

  var cousub_style_options = {
    fillColor: 'green',
    strokeColor: 'green',
    strokeWeight: 2
  };

  $scope.county_subdivisions_layer = new MapLayer('/county_subdivisions/53', cousub_style_options, map);
  
  var locations_layer_style_options = {
    icon: '/images/map_icons/location_business_gray.png'
  };

  $scope.locations_layer = new MapLayer('/locations', locations_layer_style_options, map);

  var splice_points_layer_style_options = {
    icon: '/images/map_icons/splice_point.png'
  };

  $scope.splice_points_layer = new MapLayer('/splice_points/VERIZON', splice_points_layer_style_options, map);

  /************
  * LISTENERS *
  *************/

  // Splice Points click listener
  $scope.splice_points_layer.data_layer.addListener('click', function(event) {
    var splice_point_id = event.feature.getProperty('id');
    $http.get('/splice_points/closest_vertex/' + splice_point_id).success(function(response) {
      sources.add(response.vertex_id);
    });
    event.feature.setProperty('icon', '/images/map_icons/splice_point_selected.png');
  });

  // Locations click listener
  $scope.locations_layer.data_layer.addListener('click', function(event) {
    var location_id = event.feature.getProperty('id');
    $http.get('/locations/closest_vertex/' + location_id).success(function(response) {
      targets.add(response.vertex_id);
    });
    event.feature.setProperty('icon', '/images/map_icons/location_business_selected.png');
  });

  /************
  * FUNCTIONS *
  *************/

  $scope.toggle_layer = function(layer) {
    if (!layer.visible) {
      if (!layer.data_loaded) {
        layer.load_data().then(function(data) {
          layer.data_layer.addGeoJson(data.feature_collection);
          layer.metadata = data.metadata;
          layer.data_loaded = true;
        });
      }
      layer.apply_style();
      layer.data_layer.setMap(map);
      layer.visible = true;
    } else {
      layer.data_layer.setMap(null);
      layer.visible = false;
    }
  }

});