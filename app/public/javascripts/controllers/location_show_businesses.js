// Show businesses of a selected location
app.controller('location_show_businesses', function($rootScope, $scope, $http) {
  $scope.is_visible = false;

  $scope.businesses = [];

  $scope.hide = function() {
    $scope.is_visible = false;
  }

  $rootScope.$on('map_layer_changed_visibility', function(event, map_layer) {
    if (map_layer.type === 'locations' && !map_layer.visible) {
      $scope.is_visible = false;
    }
  });

  $rootScope.$on('contextual_menu_feature', function(event, options, map_layer, feature) {
    if (map_layer.type !== 'locations') return;

    options.add('Show businesses', function(map_layer, feature) {
      var id = feature.getProperty('id');
      $http.get('/locations/businesses/' + id).success(function(response) {
        $scope.is_visible = true;
        $scope.businesses = response;
      });
    });
  });

});
