// Selected location controller
app.controller('selected_location_controller', function($rootScope, $scope, $http, map_layers, tracker) {
  $scope.location = {};
  $scope.show_households = config.ui.map_tools.locations.view.indexOf('residential') >= 0;
  $scope.config = config;

  $scope.select_random_location = function() {
    var map_layer = map_layers.getFeatureLayer('locations');
    var feature;
    map_layer.data_layer.forEach(function(f) {
      feature = feature || f;
    });
    var options = {
      add: function(text, func) {
        if (text === 'See more information') {
          func(map_layer, feature);
        }
      }
    };
    $rootScope.$broadcast('contextual_menu_feature', options, map_layer, feature);
  };

  if (config.route_planning) {
    $rootScope.$on('contextual_menu_feature', function(event, options, map_layer, feature) {
      if (map_layer.type !== 'locations') return;
      options.add('See more information', function(map_layer, feature) {
        var id = feature.getProperty('id');
        open_location(id)
      });
    });
  } else {
    $rootScope.$on('map_layer_clicked_feature', function(event, options, map_layer) {
      if (map_layer.type !== 'locations') return;
      var feature = options.feature;
      var id = feature.getProperty('id');
      open_location(id);
      tracker.track('Location selected');
    });
  }

  $rootScope.$on('open_location', function(event, id) {
    open_location(id);
  });

  function open_location(id) {
    $http.get('/locations/'+id+'/show').success(function(response) {
      response.id = id;
      set_selected_location(response);
      $('#selected_location_controller').modal('show');
      $('#selected_location_market_profile select[multiple]').select2('val', []);
      $scope.market_size = null;
      $scope.fair_share = null;
      $scope.calculate_market_size();
    });
  }

  $('#selected_location_controller').on('shown.bs.tab', function(e) {
    var href = $(e.target).attr('href');
    show_current_chart();
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

    var google_maps_key = 'AIzaSyDYjYSshVYlkt2hxjrpqTg31KdMkw-TXSM';
    var coordinates = location.geog.coordinates[1]+','+location.geog.coordinates[0];
    var params = {
      center: coordinates,
      zoom: 13,
      size: '400x150',
      maptype: 'roadmap',
      markers: 'color:red|label:L|'+coordinates,
      key: google_maps_key,
    };
    $scope.map_url = 'https://maps.googleapis.com/maps/api/staticmap?'
      + _.keys(params).map(function(key) { return key+'='+encodeURIComponent(params[key]) }).join('&');

    preserve_business_detail();
    $scope.businesses = null;
    $scope.selected_business = null;
    $http.get('/locations/businesses/' + location.id).success(function(response) {
      preserve_business_detail();
      $scope.businesses = response;
      if (!location.address) {
        var business = $scope.businesses.filter(function(business) {
          return business.address
        })[0];
        location.address = business && business.address;
      }
    });
  };

  function preserve_business_detail() {
    $('#selected_location_businesses tbody:first').append($('#location_business_selected_info').hide());
  }

  $('#selected_location_controller .nav-tabs a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
    tracker.track('Location selected / '+$(this).text());
  });

  $http.get('/market_size/filters').success(function(response) {
    $scope.filters = response;
    $('#selected_location_controller select[multiple]').each(function() {
      var self = $(this);
      self.select2({
        placeholder: self.attr('data-placeholder'),
      });
    });
  });

  $scope.calculate_market_size = function() {
    $scope.loading = true;
    var params = {
      industry: arr($scope.industry),
      employees_range: arr($scope.employees_range),
      product: arr($scope.product),
      customer_type: $scope.customer_type && $scope.customer_type.id,
    };
    var args = {
      params: params,
    };
    $http.get('/market_size/location/'+$scope.location.id, args).success(function(response) {
      $scope.market_size = response.market_size;
      $scope.fair_share = response.fair_share;
      $scope.share = response.share;
      $scope.loading = false;
      destroy_charts();
      show_current_chart();
    });
  };

  $scope.route = null;
  $rootScope.$on('route_selected', (e, route) => $scope.route = route);

  $scope.export = function() {
    $('#selected_location_controller').modal('hide');
    swal({
      title: "File name",
      type: "input",
      showCancelButton: true,
      closeOnConfirm: false,
      animation: "slide-from-top",
      inputPlaceholder: "export",
    }, function(name) {
      if (name === false) return false;
      var params = {
        type: $scope.market_type,
        industry: arr($scope.industry),
        employees_range: arr($scope.employees_range),
        product: arr($scope.product),
        customer_type: $scope.customer_type && $scope.customer_type.id,
        filename: name,
      };
      $http({
        url: '/market_size/plan/'+$scope.route.id+'/location/'+$scope.location.id+'/export',
        method: 'GET',
        params: params,
      })
      .success(function(response) {
        swal("Exported file now available");
        location.href = '/exported_file?filename='+encodeURIComponent(name);
      });
    });
  }

  function destroy_market_size_chart() {
    market_size_chart && market_size_chart.destroy();
    $('#location_market_size_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height');
  }

  function destroy_fair_share_chart() {
    fair_share_chart && fair_share_chart.destroy();
    $('#location_fair_share_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height');
  }

  function destroy_customer_profile_chart() {
    customer_profile_chart && customer_profile_chart.destroy();
    $('#location_customer_profile_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height');
  }

  function destroy_charts() {
    destroy_market_size_chart();
    destroy_fair_share_chart();
    destroy_customer_profile_chart();
  }

  function arr(value) {
    if (!value) return value;
    return value.map(function(elem) {
      return elem.id;
    }).join(',');
  }

  function show_current_chart() {
    var href = $('#selected_location_controller .nav-tabs > .active a').attr('href');
    if (href === '#selected_location_fair_share') {
      show_fair_share_chart();
    } else if (href === '#selected_location_market_profile') {
      show_market_size_chart();
    } else if (href === '#selected_location_customer_profile') {
      show_customer_profile_chart();
    }
  }

  var market_size_chart;
  function show_market_size_chart() {
    var dataset = {
      label: "Market size",
      fillColor: "rgba(151,187,205,0.2)",
      strokeColor: "rgba(151,187,205,1)",
      pointColor: "rgba(151,187,205,1)",
      pointStrokeColor: "#fff",
      pointHighlightFill: "#fff",
      pointHighlightStroke: "rgba(151,187,205,1)",
      data: [],
    };

    var carrierDataset = {
      label: "Fair share",
      fillColor: "rgba(220,220,220,0.2)",
      strokeColor: "rgba(220,220,220,1)",
      pointColor: "rgba(220,220,220,1)",
      pointStrokeColor: "#fff",
      pointHighlightFill: "#fff",
      pointHighlightStroke: "rgba(220,220,220,1)",
      data: [],
    };

    var data = {
      labels: [],
      datasets: [dataset, carrierDataset],
    };

    $scope.market_size.forEach(function(row) {
      data.labels.push(row.year);
      dataset.data.push(row.total);
      carrierDataset.data.push(row.total*$scope.share);
    });

    var options = {
      scaleLabel : "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
      tooltipTemplate: "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
      multiTooltipTemplate: "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
    };
    var ctx = document.getElementById('location_market_size_chart').getContext('2d');
    destroy_market_size_chart();
    market_size_chart = new Chart(ctx).Line(data, options);
  };

  var fair_share_chart = null;
  function show_fair_share_chart() {
    $scope.fair_share = $scope.fair_share || [];
    var total = $scope.fair_share.reduce(function(total, carrier) {
      return total + carrier.value;
    }, 0);

    var data = $scope.fair_share.map(function(carrier) {
      var distance = carrier.distance !== null ? ' ('+angular.injector(['ng']).get('$filter')('number')(carrier.distance, 2)+'m)' : ''
      return {
        label: carrier.name+distance,
        value: ((carrier.value*100)/total).toFixed(2),
        color: carrier.color,
        highlight: tinycolor(carrier.color).lighten().toString(),
      }
    });

    var options = {
      tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %>%",
    };
    var ctx = document.getElementById('location_fair_share_chart').getContext('2d');
    destroy_fair_share_chart();
    fair_share_chart = new Chart(ctx).Pie(data, options);
    document.getElementById('location_fair_share_chart_legend').innerHTML = fair_share_chart.generateLegend();
  };

  var customer_profile_chart = null;
  function show_customer_profile_chart() {
    var n = 0;
    if ($scope.show_households) {
      n = $scope.location.customer_types.length * 4;
    } else {
      n = $scope.location.customer_types.length * 2;
    }
    var colors = randomColor({ seed: 1, count: n });

    var data = [];
    var total = $scope.location.customers_businesses_total + $scope.location.customers_households_total;
    $scope.location.customer_types.forEach(function(customer_type) {
      if ($scope.show_households) {
        var color = colors.shift()
        data.push({
          label: customer_type.name+' households',
          value: customer_type.households,
          color: color,
          highlight: tinycolor(color).lighten().toString(),
        })
      }

      var color = colors.shift()
      data.push({
        label: customer_type.name+' businesses',
        value: customer_type.businesses,
        color: color,
        highlight: tinycolor(color).lighten().toString(),
      })
    });

    var options = {
      tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %>",
    };
    var ctx = document.getElementById('location_customer_profile_chart').getContext('2d');
    destroy_customer_profile_chart();
    customer_profile_chart = new Chart(ctx).Pie(data, options);
    document.getElementById('location_customer_profile_chart_legend').innerHTML = customer_profile_chart.generateLegend();
  };

  $scope.show_market_profile = function(business) {
    if ($scope.selected_business && $scope.selected_business.id === business.id) {
      $scope.selected_business = null;
      $('#location_business_selected_info').hide();
    } else {
      $scope.business_market_size = null;
      $scope.selected_business = business;
      $scope.calculate_business_market_size();

      var row = $('#location_business_row_'+business.id);
      $('#location_business_selected_info').insertAfter(row.parent()).show();
    }
  }

  $scope.calculate_business_market_size = function() {
    tracker.track('Location selected / Businesses / Business market profile');
    var params = {
      product: arr($scope.product),
    };
    var args = {
      params: params,
    };
    $http.get('/market_size/business/'+$scope.selected_business.id, args).success(function(response) {
      $scope.business_market_size = response.market_size;
      show_business_chart();
    });
  }

  function destroy_business_market_size_chart() {
    business_market_size_chart && business_market_size_chart.destroy();
    $('#business_market_size_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height');
  }

  var business_market_size_chart;
  function show_business_chart() {
    var dataset = {
      label: "Market size",
      fillColor: "rgba(151,187,205,0.2)",
      strokeColor: "rgba(151,187,205,1)",
      pointColor: "rgba(151,187,205,1)",
      pointStrokeColor: "#fff",
      pointHighlightFill: "#fff",
      pointHighlightStroke: "rgba(151,187,205,1)",
      data: [],
    };

    var data = {
      labels: [],
      datasets: [dataset],
    };

    $scope.business_market_size.forEach(function(row) {
      data.labels.push(row.year);
      dataset.data.push(row.total);
    });

    var options = {
      scaleLabel : "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
      tooltipTemplate: "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
    };
    destroy_business_market_size_chart();
    var ctx = document.getElementById('business_market_size_chart').getContext('2d');
    business_market_size_chart = new Chart(ctx).Line(data, options);
  };

});
