// Show businesses of a selected location
app.controller('location_show_businesses', function($rootScope, $scope, $http) {
  $scope.businesses = [];

  $rootScope.$on('contextual_menu_feature', function(event, options, map_layer, feature) {
    if (map_layer.type !== 'locations') return;

    options.add('Show businesses', function(map_layer, feature) {
      var id = feature.getProperty('id');
      $http.get('/locations/businesses/' + id).success(function(response) {
        $scope.businesses = response;
        $('#location_show_businesses').modal('show');
      });
    });
  });

});
