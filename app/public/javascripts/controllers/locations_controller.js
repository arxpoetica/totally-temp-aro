// Locations Controller
app.controller('locations_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', function($scope, $rootScope, $http, selection, map_tools) {

  $scope.map_tools = map_tools;
  $scope.selected_tool = null;
  $scope.show_businesses = true;
  $scope.show_households = true;

  $scope.change_locations_layer = function() {
    var layer = $rootScope.feature_layers.locations;
    if ($scope.show_businesses && $scope.show_households) {
      layer.show();
      layer.set_api_endpoint('/locations');
    } else if ($scope.show_businesses) {
      layer.show();
      layer.set_api_endpoint('/locations?type=businesses');
    } else if ($scope.show_households) {
      layer.show();
      layer.set_api_endpoint('/locations?type=households');
    } else {
      layer.hide();
    }
  }

  $rootScope.$on('map_tool_changed_visibility', function(e, tool) {
    if (tool === 'locations') {
      $scope.change_locations_layer();
    }
  });

  function create_location(event) {
    return console.log('foo', $scope.selected_tool);

    var lat = event.latLng.lat();
    var lng = event.latLng.lng();
    var address = encodeURIComponent(lat+','+lng);
    $http.get('https://maps.googleapis.com/maps/api/geocode/json?address='+address)
      .success(function(response) {
        var results = response.results;
        var result = results[0];
        if (!result) return;
        var data = {
          address: result.formatted_address,
          lat: lat,
          lon: lng,
        };
        var components = result.address_components;
        components.forEach(function(component) {
          var types = component.types
          if (types.indexOf('postal_code') >= 0) {
            data.zipcode = component.long_name;
          } else if (types.indexOf('locality') >= 0) {
            data.city = component.long_name.toUpperCase();
          } else if (types.indexOf('administrative_area_level_1') >= 0) {
            data.state = component.short_name.toUpperCase();
          }
        });
        $http.post('/locations/create', data)
          .success(function(response) {
            $rootScope.feature_layers.locations.data_layer.addGeoJson(response);
          })
      })
  };

  $scope.select_tool = function(tool) {
    if ($scope.selected_tool === tool) {
      $scope.selected_tool = null;
    } else {
      $scope.selected_tool = tool;
    }
    map.setOptions({ draggableCursor: $scope.selected_tool === null ? null : 'crosshair' });
  };

  $rootScope.$on('map_click', function(e, event) {
    if (!map_tools.is_visible('locations')) return;
    create_location(event);
  });

}]);
