// Customer Profile Controller
app.controller('customer_profile_controller', ['$scope', '$rootScope', '$http', '$q', function($scope, $rootScope, $http, $q) {

  $scope.type = 'route';
  $scope.loading = false;
  $scope.data = {};
  $scope.show_households = config.ui.map_tools.locations.view.indexOf('residential') >= 0;

  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
  });

  var chart = null;
  var geo_json;

  $rootScope.$on('boundary_selected', function(e, json, title, type) {
    if (type !== 'customer_profile') return;

    geo_json = json;
    $scope.type = 'all';
    $scope.calculate_customer_profile();
    open_modal(title);
  });

  $rootScope.$on('customer_profile_selected', function(e, json, title, type) {
    $scope.data = $scope.route.metadata;
    $scope.type = 'route';
    open_modal(null);
    show_chart();
  });

  function open_modal(title) {
    $('#modal-customer-profile .modal-title').text(title ? 'Customer profile · '+title : 'Customer profile');
    $('#modal-customer-profile').modal('show');
  }

  var canceller = null;
  $scope.calculate_customer_profile = function() {
    $scope.data = {};
    var params = {
      boundary: geo_json && JSON.stringify(geo_json),
      type: $scope.type,
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
    $http.get('/customer_profile/'+$scope.route.id+'/boundary', args).success(function(response) {
      $scope.data = response;
      show_chart();
    }).error(function() {
      $scope.loading = false;
    });
  }

  function show_chart() {
    $scope.loading = false;
    $scope.data.customer_types = $scope.data.customer_types || [];

    var colors = randomColor({ seed: 1, count: $scope.data.customer_types.length });
    var data = $scope.data.customer_types.map(function(customer_type) {
      var color = colors.shift();
      return {
        name: customer_type.name,
        value: customer_type.businesses + customer_type.households,
        color: color,
        highlight: tinycolor(color).lighten().toString(),
      }
    });

    chart && chart.destroy();
    var options = {};
    var ctx = document.getElementById('customer-profile-chart').getContext('2d');
    chart = new Chart(ctx).Pie(data, options);
  }

}]);
