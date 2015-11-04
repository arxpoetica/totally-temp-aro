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

  $http.get('/locations_filters').success(function(response) {
    $scope.industries = response.industries;
    $scope.customer_types = response.customer_types;
    $scope.employees_by_location = response.employees_by_location;

    // industries
    $('#create-location select.industries').select2({ placeholder: 'Select an industry' });

    // customer_types
    $('#create-location select.households_customer_types').select2({ placeholder: 'Select a customer type' });
    $('#create-location select.businesses_customer_types').select2({ placeholder: 'Select a customer type' });

    // filters
    $scope.industries.forEach(function(industry) {
      industry.text = industry.industry_name;
    });
    $scope.customer_types.forEach(function(customer_type) {
      customer_type.text = customer_type.name;
    });
    $scope.employees_by_location.forEach(function(employee_by_location) {
      employee_by_location.text = employee_by_location.value_range;
    });

    $('#locations_controller .select2-industries').select2({
      placeholder: 'Any industry',
      multiple: true,
      data: $scope.industries,
    });

    $('#locations_controller .select2-customer-types').select2({
      placeholder: 'Any customer type',
      multiple: true,
      data: $scope.customer_types,
    });

    $('#locations_controller .select2-number-of-employees').select2({
      placeholder: 'Any number of employees',
      multiple: true,
      data: $scope.employees_by_location,
    });

  });

  $scope.change_locations_layer = function() {
    var density = $rootScope.feature_layers.locations_density;
    var layer = $rootScope.feature_layers.locations;
    if ($scope.overlay === 'density') {
      density.show();
      density.reload_data();
      layer.hide();
    } else {
      density.hide();

      var industries = $('#locations_controller .select2-industries').select2('val');
      var customer_types = $('#locations_controller .select2-customer-types').select2('val');
      var number_of_employees = $('#locations_controller .select2-number-of-employees').select2('val');

      if (!$scope.show_businesses && !$scope.show_households) {
        layer.hide();
      } else {
        var type;
        if ($scope.show_businesses && $scope.show_households) {
          type = '';
        } else if ($scope.show_businesses) {
          type = 'businesses';
        } else if ($scope.show_households) {
          type = 'huseholds';
        }
        layer.set_api_endpoint('/locations/'+$scope.route.id, {
          industries: industries.join(','),
          customer_types: customer_types.join(','),
          number_of_employees: number_of_employees.join(','),
          type: type,
        });
        layer.show();
      }
    }

    if ($scope.show_businesses && $scope.overlay === 'none') {
      $('#locations_controller .business-filter').prop('disabled', false);
    } else {
      $('#locations_controller .business-filter').select2('val', [], true);
      $('#locations_controller .business-filter').prop('disabled', true);
    }
  }

  $('#create-location').on('shown.bs.modal', function() {
    $('#create-location select').val('').trigger("change");
  });

  $scope.route = null;
  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
  });

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

}]);
