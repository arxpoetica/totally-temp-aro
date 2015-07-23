// Selected location controller
app.controller('selected_location_controller', function($rootScope, $scope, $http) {
  $scope.is_visible = false;

  $scope.location = {};

  $rootScope.$on('map_Layer_changed_visibility', function(event, map_layer) {
    if (map_layer.type === 'locations') {
      $scope.is_visible = map_layer.visible;
    }
  });

  $rootScope.$on('map_Layer_rightclicked_feature', function(event, map_layer, feature) {
    if (map_layer.type === 'locations') {
      var id = feature.getProperty('id');
      $http.get('/locations/house_hold_summary/' + id).success(function(response) {
        set_selected_location(response);
      });
    }
  });

  $rootScope.$on('map_rightclick', function(e, event) {
    if (!$scope.is_visible) return;
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
            console.log('response', response)
            $rootScope.feature_layers.locations.data_layer.addGeoJson(response);
          })
      })
  });

  $scope.update = function() {
    var location = $scope.location
    var location_id = location.location_id;
    $http.post('/locations/update/'+location_id, {
      number_of_households: location.number_of_households,
    }).success(function(response) {
      // success
    })
  }

  function set_selected_location(location) {
    $scope.location = location;
  };

});
