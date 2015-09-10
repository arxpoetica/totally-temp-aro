// Market Size Controller
app.controller('market_size_controller', ['$q', '$scope', '$rootScope', '$http', 'selection', 'map_tools', function($q, $scope, $rootScope, $http) {
  // Controller instance variables
  $scope.total = [];
  $scope.filters = null;
  $scope.loading = false;

  // filters
  $scope.threshold = 152.4; // 500 feet in meters
  $scope.industry = null;
  $scope.product = null;
  $scope.employees_range = null;

  /************
  * FUNCTIONS *
  *************/

  var geo_json;

  $http.get('/market_size/filters').success(function(response) {
    $scope.filters = response;
  });

  $rootScope.$on('boundary_selected', function(e, json) {
    $('#market-size').modal('show');
    geo_json = json;
    $scope.calculate_market_size();
  });

  var canceller = null;
  $scope.calculate_market_size = function() {
    var params = {
      geo_json:  JSON.stringify(geo_json),
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
    $scope.total = [];
    $scope.loading = true;
    $http.get('/market_size/calculate', args).success(function(response) {
      $scope.total = response;
      $scope.loading = false;
    }).error(function() {
      $scope.loading = false;
    });
  }

}]);
