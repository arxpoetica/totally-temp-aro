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
  });

  $rootScope.$on('boundary_selected', function(e, json, title) {
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
      industry: $scope.industry && $scope.industry.id,
      employees_range: $scope.employees_range && $scope.employees_range.id,
      product: $scope.product && $scope.product.id,
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
    chart = new Chart(ctx).Line(data, options);
  };

}]);
