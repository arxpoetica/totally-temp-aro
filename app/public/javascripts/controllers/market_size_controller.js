// Market Size Controller
app.controller('market_size_controller', ['$q', '$scope', '$rootScope', '$http', 'selection', 'map_tools', function($q, $scope, $rootScope, $http) {
  // Controller instance variables
  $scope.filters = null;
  $scope.loading = false;

  // filters
  $scope.threshold = 152.4; // 500 feet in meters
  $scope.industry = null;
  $scope.product = null;
  $scope.employees_range = null;
  $scope.values = [];

  /************
  * FUNCTIONS *
  *************/

  var geo_json;

  $http.get('/market_size/filters').success(function(response) {
    $scope.filters = response;
    $('#market-size select[multiple]').each(function() {
      var self = $(this);
      self.select2({
        placeholder: self.attr('data-placeholder'),
      });
    });
  });

  $rootScope.$on('boundary_selected', function(e, json, title, type) {
    if (type !== 'market_size') return;
    
    geo_json = json;
    $scope.market_type = 'boundary';
    $scope.calculate_market_size();
    $('#market-size .modal-title').text('Market profile · '+title);
    $('#market-size').modal('show');
  });

  $rootScope.$on('market_profile_selected', function(e, values) {
    geo_json = null;
    $scope.market_type = 'route';
    $('#market-size .modal-title').text('Market profile');
    $('#market-size').modal('show');

    if (values) {
      $('#market-size select').val('').trigger('change');
      chart && chart.destroy();
      $scope.values = values;
      show_chart();
    } else {
      $scope.calculate_market_size();
    }
  });

  $scope.route = null;
  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
  });

  var canceller = null;
  $scope.calculate_market_size = function() {
    $scope.values = [];
    var params = {
      boundary: geo_json && JSON.stringify(geo_json),
      type: $scope.market_type,
      industry: arr($scope.industry),
      employees_range: arr($scope.employees_range),
      product: arr($scope.product),
    };
    if (canceller) canceller.resolve();
    canceller = $q.defer();
    var args = {
      params: params,
      timeout: canceller.promise,
      customErrorHandling: true,
    };
    $scope.loading = true;
    chart && chart.destroy();
    $http.get('/market_size/'+$scope.route.id+'/calculate', args).success(function(response) {
      $scope.loading = false;
      $scope.values = response;
      show_chart();
    }).error(function() {
      $scope.loading = false;
    });
  }

  function arr(value) {
    if (!value) return value;
    return value.map(function(elem) {
      return elem.id;
    }).join(',');
  }

  $scope.export = function() {
    $('#market-size').modal('hide');
    swal({
      title: "File name",
      type: "input",
      showCancelButton: true,
      closeOnConfirm: true,
      animation: "slide-from-top",
      inputPlaceholder: "export",
    }, function(name) {
      if (name === false) return false;
      var params = {
        boundary: geo_json && JSON.stringify(geo_json),
        type: $scope.market_type,
        industry: arr($scope.industry),
        employees_range: arr($scope.employees_range),
        product: arr($scope.product),
        filename: name,
      };
      var pairs = _.keys(params).map(function(key) {
        var value = params[key];
        if (!value) return null;
        return key+'='+encodeURIComponent(value);
      });
      var href = '/market_size/'+$scope.route.id+'/export?'+_.compact(pairs).join('&');
      location.href = href;
    });
  }

  var chart = null;

  function show_chart() {
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

    $scope.values.forEach(function(row) {
      data.labels.push(row.year);
      dataset.data.push(row.total);
    });

    var options = {
      scaleLabel : "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
      tooltipTemplate: "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
    };
    var ctx = document.getElementById('market-size-chart').getContext('2d');
    chart && chart.destroy();
    chart = new Chart(ctx).Line(data, options);
  };

}]);
