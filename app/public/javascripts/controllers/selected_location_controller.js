// Selected location controller
app.controller('selected_location_controller', function($rootScope, $scope, $http) {
  $scope.is_visible = true;

  $scope.location = {};

  $scope.update = function() {
    var location = $scope.location
    var location_id = location.location_id;
    $http.post('/locations/update/'+location_id, {
      number_of_households: location.number_of_households,
    }).success(function(response) {
      console.log('success')
    })
  }

  $rootScope.set_selected_location = function(location) {
    location.number_of_households = location.number_of_households || '0'
    $scope.location = location;
  };

});
