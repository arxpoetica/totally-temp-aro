// Locations Controller
app.controller('locations_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', 'map_layers', 'MapLayer', 'CustomOverlay', 'tracker', function($scope, $rootScope, $http, selection, map_tools, map_layers, MapLayer, CustomOverlay, tracker) {

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

  var locations_layer = $scope.locations_layer = new MapLayer({
    type: 'locations',
    name: 'Locations',
    short_name: 'L',
    api_endpoint: '/locations/:plan_id',
    style_options: {
      normal: {
        icon: '/images/map_icons/location_business_gray.png',
        visible: true,
        fillColor: 'blue',
        strokeColor: 'blue',
        strokeWeight: 1,
      },
      selected: {
        icon: '/images/map_icons/location_business_selected.png',
        visible: true,
      },
    },
    threshold: 15,
    reload: 'always',
    heatmap: true,
  });

  var customer_profile_layer = new MapLayer({
    type: 'locations_customer_profile_density',
    api_endpoint: '/locations_customer_profile_density',
    style_options: {
      normal: {
        strokeColor: 'blue',
        strokeWeight: 2,
        fillColor: 'blue',
      }
    },
    threshold: 100,
    reload: 'always',
    // heatmap: true,
  });

  map_layers.addFeatureLayer(locations_layer);
  map_layers.addFeatureLayer(customer_profile_layer);

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
    tracker.track('Locations / '+$scope.overlay);

    customer_profile_layer.set_visible($scope.overlay === 'customer_profile');

    if ($scope.overlay === 'none') {
      var industries = $('#locations_controller .select2-industries').select2('val');
      var customer_types = $('#locations_controller .select2-customer-types').select2('val');
      var number_of_employees = $('#locations_controller .select2-number-of-employees').select2('val');

      if (!$scope.show_businesses && !$scope.show_households) {
        locations_layer.hide();
      } else {
        var type;
        if ($scope.show_businesses && $scope.show_households) {
          type = '';
        } else if ($scope.show_businesses) {
          type = 'businesses';
        } else if ($scope.show_households) {
          type = 'huseholds';
        }
        locations_layer.set_api_endpoint('/locations/:plan_id', {
          industries: industries.join(','),
          customer_types: customer_types.join(','),
          number_of_employees: number_of_employees.join(','),
          type: type,
        });
        locations_layer.show();
      }
    } else {
      locations_layer.hide();
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
        locations_layer.data_layer.addGeoJson(response);
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
    $scope.route = route;
    
    if (route) {
      map.ready(function() {
        map_layers.getEquipmentLayer('network_nodes').set_always_show_selected($scope.always_shows_sources);
        locations_layer.set_always_show_selected($scope.always_shows_targets);
      });
    }
  });

  $scope.toggle_always_show_sources = function() {
    map_layers.getEquipmentLayer('network_nodes').set_always_show_selected($scope.always_shows_sources);
  };

  $scope.toggle_always_show_targets = function() {
    locations_layer.set_always_show_selected($scope.always_shows_targets);
  };

  $scope.overlay_is_loading = function() {
    return customer_profile_layer.is_loading;
  }

  var overlays = [];
  $http.get('/customer_profile/all_cities')
    .success(function(response) {
      overlays = response.map(function(city) {
        var id = 'customer_profile_'+city.id;
        var chart = document.createElement('canvas');
        chart.setAttribute('id', id);
        chart.style.width = '100%';
        chart.style.height = '100%';

        var width = 150;
        var height = 150;
        var coordinates = city.centroid.coordinates;
        var latLng = new google.maps.LatLng(coordinates[1], coordinates[0]);
        return new CustomOverlay(map, chart, width, height, latLng, function() {
          var colors = randomColor({ seed: 1, count: city.customer_profile.customer_types.length });
          var data = city.customer_profile.customer_types.map(function(customer_type) {
            var color = colors.shift();
            return {
              name: customer_type.name,
              label: customer_type.name,
              value: (customer_type.businesses + customer_type.households)*100 / city.customer_profile.customers_businesses_total,
              color: color,
              highlight: tinycolor(color).lighten().toString(),
            }
          });

          // chart && chart.destroy();
          var options = {
            tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= angular.injector(['ng']).get('$filter')('number')(value, 0) %>%",
          };
          var ctx = document.getElementById(id).getContext('2d');
          var chart = new Chart(ctx).Pie(data, options);
        });
      });
      configure_overlays_visibility();
    });

  function configure_overlays_visibility() {
    var visible = map.getZoom() < 12;
    overlays.forEach(function(overlay) {
      visible ? overlay.show() : overlay.hide();
    });
  }

  $rootScope.$on('map_zoom_changed', configure_overlays_visibility);

}]);
