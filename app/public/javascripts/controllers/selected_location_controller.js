// Selected location controller
app.controller('selected_location_controller', function($rootScope, $scope, $http) {
  $scope.is_visible = false;

  $scope.location = {};

  $rootScope.$on('map_Layer_changed_visibility', function(event, map_layer) {
    if (map_layer.type === 'locations') {
      $scope.is_visible = map_layer.visible;
    }
  })

  $rootScope.$on('map_Layer_rightclicked_feature', function(event, map_layer, feature) {
    if (map_layer.type === 'locations') {
      var id = feature.getProperty('id');
      $http.get('/locations/house_hold_summary/' + id).success(function(response) {
        set_selected_location(response);
      });
    }
  })

  $scope.update = function() {
    var location = $scope.location
    var location_id = location.location_id;
    $http.post('/locations/update/'+location_id, {
      number_of_households: location.number_of_households,
    }).success(function(response) {
      // success
    })
  }

  function set_selected_location(location) {
    $scope.location = location;
  };

});
