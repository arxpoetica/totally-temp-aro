// Market Size Controller
app.controller('market_size_controller', ['$q', '$scope', '$rootScope', '$http', 'selection', 'map_tools', function($q, $scope, $rootScope, $http, selection, map_tools) {
  // Controller instance variables
  $scope.map_tools = map_tools;
  $scope.total = [];
  $scope.filters = null;

  // filters
  $scope.threshold = 0;
  $scope.industry = null;
  $scope.product = null;
  $scope.employees_range = null;

  $scope.area = null;

  var geo_json;

  /************
  * FUNCTIONS *
  *************/

  $http.get('/market_size/filters').success(function(response) {
    $scope.filters = response;
  });

  // Listen for visibility toggle to be broadcast through $rootScope from other controller (map_tools_controller)
  $rootScope.$on('map_tool_changed_visibility', function(e, tool) {
    if (tool === 'market_size') {
      $rootScope.area_layers.census_blocks_layer.set_highlighteable(map_tools.is_visible('market_size'));
    }
  });

  $rootScope.$on('map_layer_clicked_feature', function(e, event, layer) {
    if (layer.type === 'census_blocks' && map_tools.is_visible('market_size')) {
      $scope.area = event.feature.getProperty('name');
      event.feature.toGeoJson(function(obj) {
        geo_json = JSON.stringify(obj.geometry);
        $scope.calculate_market_size();
      });
    }
  });

  $scope.clear_area = function() {
    var bounds = map.getBounds();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();
    var nw = new google.maps.LatLng(ne.lat(), sw.lng());
    var se = new google.maps.LatLng(sw.lat(), ne.lng());

    geo_json = JSON.stringify({
      "type":"MultiPolygon",
      "coordinates":[[[
        [ne.lng(),ne.lat()],
        [se.lng(),se.lat()],
        [sw.lng(),sw.lat()],
        [nw.lng(),nw.lat()],
        [ne.lng(),ne.lat()],
      ]]]
    });
    $scope.calculate_market_size();
  }

  var canceller = null;
  $scope.calculate_market_size = function() {
    var params = {
      geo_json: geo_json,
      industry: $scope.industry && $scope.industry.id,
      employees_range: $scope.employees_range && $scope.employees_range.id,
      product: $scope.product && $scope.product.id,
    };
    if (canceller) canceller.resolve();
    canceller = $q.defer();
    var args = { params: params, timeout: canceller.promise };
    $scope.total = [];
    $http.get('/market_size/calculate', args).success(function(response) {
      $scope.total = _.reject(response, function(row) {
        return !(+row.total);
      });
    })
  }


}]);
