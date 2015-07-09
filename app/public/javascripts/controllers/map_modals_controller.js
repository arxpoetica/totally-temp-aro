// Map Modals Controller
app.controller('map_modals_controller', ['$scope', '$rootScope', '$http', 'sources', 'targets', function($scope, $rootScope, $http, sources, targets) {
  // Controller instance variables
  $scope.is_visible = false;
  $scope.sources = sources;
  $scope.targets = targets;

  /************
  * FUNCTIONS *
  *************/

  // Listen for visibility toggle to be broadcast through $rootScope from other controller (map_tools_controller)
  $rootScope.$on('toggle_tool_visibility', function() {
    $scope.is_visible = !$scope.is_visible;
  });
  
  $scope.create_route = function() {
  	var source = $scope.sources[0].vertex_id;
  	var target = $scope.targets[0].vertex_id;
    console.log('/route_optimizer/shortest_path/' + source + '/' + target);
  	$http.get('/route_optimizer/shortest_path/' + source + '/' + target).success(function(response) {
  		$scope.route_layer = new google.maps.Data();
  		$scope.route_layer.addGeoJson(response);
  		$scope.route_layer.setStyle(function(feature) {
  			var color = feature.getProperty('color');
  			return ({
  				strokeColor: color
  			});
  		});
  		$scope.route_layer.setMap(map);
  	});
  }

}]);