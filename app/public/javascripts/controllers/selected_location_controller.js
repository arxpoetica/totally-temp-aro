// Selected location controller
app.controller('selected_location_controller', function($rootScope, $scope, $http) {
  $scope.location = {};

  $rootScope.$on('contextual_menu_feature', function(event, options, map_layer, feature) {
    if (map_layer.type !== 'locations') return;
    options.add('See more information', function(map_layer, feature) {
      var id = feature.getProperty('id');
      $http.get('/locations/' + id).success(function(response) {
        set_selected_location(response);
        $('#selected_location_controller').modal('show');
      });
    });
  });

  $rootScope.$on('contextual_menu_map', function(e, options) {
    if (!$rootScope.feature_layers.locations.is_visible) return;

    options.add('Add location here', function(event) {
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
    });
  });

  $scope.update = function() {
    var location = $scope.location
    var location_id = location.location_id;
    $http.post('/locations/'+location_id+'/update', {
      number_of_households: location.number_of_households,
    }).success(function(response) {
      $('#selected_location_controller').modal('hide');
    })
  }

  function set_selected_location(location) {
    location.total_costs = location.entry_fee
                          + location.household_install_costs * location.number_of_households
                          + location.business_install_costs * location.number_of_businesses;
    $scope.location = location;
  };

});
