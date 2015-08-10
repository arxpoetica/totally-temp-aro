// Navigation Menu Controller
app.controller('navigation_menu_controller', ['$scope', '$rootScope', '$http', 'map_tools', function($scope, $rootScope, $http, map_tools) {
  // Controller instance variables
  $scope.new_route_name = 'Untitled plan';
  $scope.edit_route_name;

  $scope.route = null;
  $scope.routes = [];

  /************
  * FUNCTIONS *
  *************/

  $scope.select_route = function(route) {
    $scope.route = route;
    $rootScope.$broadcast('route_selected', route);
    map_tools.show('route');
    $('#select-route').modal('hide');
  };

  $scope.create_route = function() {
    $http.post('/route_optimizer/create').success(function(response) {
      $scope.select_route(response);
    });
  };

  $scope.delete_route = function(route) {
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover the deleted route!",
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      showCancelButton: true,
      closeOnConfirm: true,
    }, function() {
      $http.post('/route_optimizer/'+route.id+'/delete').success(function(response) {
        $scope.show_routes();
      });
    });
  };

  $scope.show_routes = function() {
    $http.get('/route_optimizer/find_all').success(function(response) {
      $scope.routes = response;
      $('#select-route').modal('show');
    });
  };

  $scope.new_route = function() {
    $('#new-route').modal('show');
  };

  $scope.save_new_route = function() {
    var params = { name: $scope.new_route_name };
    $http.post('/route_optimizer/create', params).success(function(response) {
      $scope.select_route(response);
      $('#new-route').modal('hide');
      $scope.new_route_name = 'Untitled plan';
    });
  };

  $scope.save_as = function() {
    $scope.edit_route_name = $scope.route.name;
    $('#edit-route').modal('show');
  };

  $scope.save_changes = function() {
    $scope.route.name = $scope.edit_route_name;
    $http.post('/route_optimizer/'+$scope.route.id+'/save', $scope.route).success(function(response) {
      $('#edit-route').modal('hide');
    });
  };

  $scope.clear_route = function() {
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover the deleted data!",
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, clear it!",
      showCancelButton: true,
      closeOnConfirm: true,
    }, function() {
      $rootScope.$broadcast('route_cleared', $scope.route);
      $http.post('/route_optimizer/'+$scope.route.id+'/clear').success(function(response) {
        // success
      });
    });
  }

}]);
