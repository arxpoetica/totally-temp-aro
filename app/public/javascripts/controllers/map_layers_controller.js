// Map Layers Controller
//
// Handles display of and interaction with all layers of the map
app.controller('map_layers_controller', function($scope, $http, sources, targets) {
  // Controller instance variables
  $scope.county_subdivisions_layer = new google.maps.Data();
  $scope.locations_layer = new google.maps.Data();
  $scope.splice_points_layer = new google.maps.Data();

  // This is silly we need to get rid of this
  var map_icons_path = 'images/map_icons/';

  // Layer states should be cached properly, not stored like this
  var layer_properties = {
    county_subdivisions_layer: {
      visible: false,
      loaded: false,
      api_endpoint: '/county_subdivisions/53'
    },
    locations_layer: {
      visible: false,
      loaded: false,
      api_endpoint: '/locations'
    },
    splice_points_layer: {
      visible: false,
      loaded: false,
      api_endpoint: '/splice_points/VERIZON'
    }
  };

  /************
  * LISTENERS *
  *************/

  // Splice Points click listener
  $scope.splice_points_layer.addListener('click', function(event) {
    var splice_point_id = event.feature.getProperty('id');
    $http.get('/splice_points/closest_vertex/' + splice_point_id).success(function(response) {
      sources.add(response);
    });
    event.feature.setProperty('icon', 'splice_point_selected.png');
  });

  // Locations click listener
  $scope.locations_layer.addListener('click', function(event) {
    var location_id = event.feature.getProperty('id');
    $http.get('/locations/closest_vertex/' + location_id).success(function(response) {
      targets.add(response);
    });
    event.feature.setProperty('icon', 'location_business_selected.png');
  });

  /************
  * FUNCTIONS *
  *************/

  // Toggle the visibility of any layer on the map
  $scope.toggle_layer_visibility = function(layer, layer_name) {
    if (!layer_properties[layer_name].visible) {
      if (!layer_properties[layer_name].loaded) {
        layer.loadGeoJson(layer_properties[layer_name].api_endpoint);
        layer.setStyle(function(feature) {
          if (feature.getProperty('icon')) {
            var icon = feature.getProperty('icon');
            return ({
              icon: map_icons_path + icon
            });
          } else {
            var color = feature.getProperty('color');
            return ({
              fillColor: color,
              strokeColor: color,
              strokeWeight: 2
            });
          }
        });
        layer_properties[layer_name].loaded = true;
      }
      layer.setMap(map);
      layer_properties[layer_name].visible = true;
    } else {
      layer.setMap(null)
      layer_properties[layer_name].visible = false;
    }
  } 

});