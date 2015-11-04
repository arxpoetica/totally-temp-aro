// Selected location controller
app.controller('selected_location_controller', function($rootScope, $scope, $http) {
  $scope.location = {};
  $scope.show_households = config.ui.map_tools.locations.view.indexOf('residential') >= 0;

  $scope.select_random_location = function() {
    var map_layer = $rootScope.feature_layers.locations;
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

  $rootScope.$on('contextual_menu_feature', function(event, options, map_layer, feature) {
    if (map_layer.type !== 'locations') return;
    options.add('See more information', function(map_layer, feature) {
      var id = feature.getProperty('id');
      $http.get('/locations/'+id+'/show').success(function(response) {
        response.id = id;
        set_selected_location(response);
        $('#selected_location_controller a:first').tab('show');
        $('#selected_location_controller').modal('show');
        $('#selected_location_market_profile select[multiple]').select2('val', []);
        $scope.market_size = null;
      });
    });
  });

  $('#selected_location_controller').on('shown.bs.tab', function(e) {
    if ($(e.target).attr('href') === '#selected_location_market_profile' && !$scope.market_size) {
      $scope.calculate_market_size();
    }
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

  $('#selected_location_controller .nav-tabs a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });

  $http.get('/market_size/filters').success(function(response) {
    $scope.filters = response;
    $('#selected_location_market_profile select[multiple]').each(function() {
      var self = $(this);
      self.select2({
        placeholder: self.attr('data-placeholder'),
      });
    });
  });

  $scope.calculate_market_size = function() {
    $scope.market_size = null;
    $scope.loading = true;
    var params = {
      industry: arr($scope.industry),
      employees_range: arr($scope.employees_range),
      product: arr($scope.product),
    };
    var args = {
      params: params,
    };
    $http.get('/market_size/location/'+$scope.location.id, args).success(function(response) {
      $scope.market_size = response;
      $scope.loading = false;
      show_market_profile_chart();
    });
  };

  function arr(value) {
    if (!value) return value;
    return value.map(function(elem) {
      return elem.id;
    }).join(',');
  }

  var chart;
  function show_market_profile_chart() {
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

    $scope.market_size.forEach(function(row) {
      data.labels.push(row.year);
      dataset.data.push(row.total);
    });

    var options = {
      scaleLabel : "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
      tooltipTemplate: "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
    };
    var ctx = document.getElementById('location-market-size-chart').getContext('2d');
    chart && chart.destroy();
    $('#selected_location_market_profile canvas').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height');
    chart = new Chart(ctx).Line(data, options);
  };

});
