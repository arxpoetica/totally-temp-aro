// Locations Controller
app.controller('locations_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', function($scope, $rootScope, $http, selection, map_tools) {

  $scope.map_tools = map_tools;
  $scope.selected_tool = null;
  $scope.available_tools = [
    {
      key: 'commercial',
      name: 'Commercial',
    },
    {
      key: 'residential',
      name: 'Residential',
    },
    {
      key: 'combo',
      name: 'Combo',
    }
  ];
  $scope.overlay = 'none';

  $scope.available_tools = _.reject($scope.available_tools, function(tool) {
    return config.ui.map_tools.locations.build.indexOf(tool.key) === -1;
  })

  $scope.user_id = user_id;

  $scope.show_commercial = config.ui.map_tools.locations.view.indexOf('commercial') >= 0;
  $scope.show_residential = config.ui.map_tools.locations.view.indexOf('residential') >= 0;

  $scope.show_businesses = $scope.show_commercial;
  $scope.show_households = $scope.show_households;

  $scope.always_shows_sources = true;
  $scope.always_shows_targets = true;
  $scope.show_locations_off = true;
  $scope.locations_filter = 'both';

  $scope.new_location_data = null;

  $scope.industries = [];

  $scope.feature_layers = $rootScope.feature_layers;

  $http.get('/industries')
    .success(function(response) {
      $scope.industries = response;
      $('#create-location select.industries').select2({ placeholder: 'Select an industry' });
    });

  $http.get('/customer_types')
    .success(function(response) {
      $scope.customer_types = response;
      $('#create-location select.households_customer_types').select2({ placeholder: 'Select a customer type' });
      $('#create-location select.businesses_customer_types').select2({ placeholder: 'Select a customer type' });
    });

  $('#create-location').on('shown.bs.modal', function() {
    $('#create-location select').val('').trigger("change");
  });

  $scope.route = null;
  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
  });

  $scope.change_locations_layer = function() {
    var layer = $rootScope.feature_layers.locations;
    if (!$scope.show_businesses && !$scope.show_households) {
      layer.hide();
    } else {
      layer.show();
      var filter;
      if ($scope.show_businesses && $scope.show_households) {
        filter = '';
      } else if ($scope.show_businesses) {
        filter = '?type=businesses';
      } else if ($scope.show_households) {
        filter = '?type=huseholds';
      }
      layer.set_api_endpoint('/locations/'+$scope.route.id+filter);
    }
  }

  $rootScope.$on('map_tool_changed_visibility', function(e, tool) {
    if (tool === 'locations') {
      $scope.change_locations_layer();
      if (!map_tools.is_visible('locations')) {
        $scope.selected_tool = null;
        map.setOptions({ draggableCursor: null });
      }
    }
  });

  $scope.create_location = function() {
    $http.post('/locations/create', $scope.new_location_data)
      .success(function(response) {
        $('#create-location').modal('hide');
        $scope.new_location_data = {};
        $rootScope.feature_layers.locations.data_layer.addGeoJson(response);
      });
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
    if (!map_tools.is_visible('locations') || !$scope.selected_tool) return;
    var lat = event.latLng.lat();
    var lng = event.latLng.lng();
    var address = encodeURIComponent(lat+','+lng);
    $scope.new_location_data = {
      type: $scope.selected_tool,
      lat: lat,
      lon: lng,
    };
    $('#create-location').modal('show');
    $http.get('https://maps.googleapis.com/maps/api/geocode/json?address='+address)
      .success(function(response) {
        var results = response.results;
        var result = results[0];
        if (!result) return;
        $scope.new_location_data.address = result.formatted_address;
        var components = result.address_components;
        components.forEach(function(component) {
          var types = component.types
          if (types.indexOf('postal_code') >= 0) {
            $scope.new_location_data.zipcode = component.long_name;
          } else if (types.indexOf('locality') >= 0) {
            $scope.new_location_data.city = component.long_name.toUpperCase();
          } else if (types.indexOf('administrative_area_level_1') >= 0) {
            $scope.new_location_data.state = component.short_name.toUpperCase();
          }
        });
      });
  });

  $rootScope.$on('route_selected', function(e, route) {
    if (route) {
      map.ready(function() {
        $rootScope.equipment_layers.network_nodes.set_always_show_selected($scope.always_shows_sources);
        $rootScope.feature_layers.locations.set_always_show_selected($scope.always_shows_targets);
      });
    }
  });

  $scope.toggle_always_show_sources = function() {
    $rootScope.equipment_layers.network_nodes.set_always_show_selected($scope.always_shows_sources);
  };

  $scope.toggle_always_show_targets = function() {
    $rootScope.feature_layers.locations.set_always_show_selected($scope.always_shows_targets);
  };

  $scope.overlay_changed = function() {
    var density = $rootScope.feature_layers.locations_density;
    var layer = $rootScope.feature_layers.locations;
    if ($scope.overlay === 'density') {
      density.show();
      density.reload_data();
      layer.hide();
    } else {
      density.hide();
      layer.show();
      layer.reload_data();
    }
  }

  $scope.on_zoom_changed = function() {
    var layer = $rootScope.feature_layers.locations;
    if (layer.threshold >= map.getZoom()) {
      $scope.overlay = 'density';
      $scope.overlay_changed();

      if (!$rootScope.$$phase) { $rootScope.$apply(); }
    }
  }

  $rootScope.$on('map_zoom_changed', $scope.on_zoom_changed);
  $(document).ready(function() {
    map.ready($scope.on_zoom_changed);
  });

}]);
