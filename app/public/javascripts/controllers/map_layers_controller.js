// Map Layers Controller
app.controller('map_layers_controller', function($scope) {
  $scope.county_subdivisions_layer = new google.maps.Data();
  $scope.locations_layer = new google.maps.Data();
  $scope.splice_points_layer = new google.maps.Data();

  var map_icons_path = 'images/map_icons/';

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