// Equipment Nodes Controller
app.controller('equipment_nodes_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', function($scope, $rootScope, $http, selection, map_tools) {
  // Controller instance variables
  $scope.map_tools = map_tools;
  $scope.node_type;

  // TODO: fetch this information from the server
  var node_types = $scope.node_types = [];

  $http.get('/network/nodes').success(function(response) {
    response = _.reject(response, function(type) {
      return type.name === 'central_office';
    });
    node_types = $scope.node_types = response;
    $scope.node_type = response[0];
  })

  function empty_changes() {
    return { insertions:[] };
  }

  var changes = empty_changes();
  $scope.route = null;

  /************
  * FUNCTIONS *
  *************/

  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
  });

  $scope.save_nodes = function() {
    $http.post('/network/nodes/'+$scope.route.id+'/edit', changes).success(function(response) {
      changes = empty_changes();
      $rootScope.feature_layers.network_nodes.reload_data(); // to get the ids so they can be selected
    });
  };

  $scope.clear_nodes = function() {
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover the deleted data!",
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, clear them!",
      showCancelButton: true,
      closeOnConfirm: true,
    }, function() {
      $http.post('/network/nodes/'+$scope.route.id+'/clear').success(function(response) {
        $rootScope.feature_layers.network_nodes.reload_data();
      });
    });
  };

  $scope.place_random_equipment = function() {
    var gm_event = {
      latLng: new google.maps.LatLng(40.77682494132765, -73.95257949829102),
    }
    $rootScope.$broadcast('map_click', gm_event);
  };

  $scope.show_number_of_features = function() {
    $scope.number_of_features = $rootScope.feature_layers.network_nodes.number_of_features();
  };

  $rootScope.$on('map_click', function(e, gm_event) {
    if (!map_tools.is_visible('equipment_nodes') || !$scope.route) return;

    var type = $scope.node_type.name;
    var coordinates = gm_event.latLng;
    var feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [ coordinates.lng(), coordinates.lat() ],
      }
    };
    changes.insertions.push({
      lat: coordinates.lat(),
      lon: coordinates.lng(),
      type: _.findWhere(node_types, { name: type }).id,
    });
    var layer = $rootScope.feature_layers.network_nodes;
    var arr = layer.data_layer.addGeoJson(feature);
    arr.forEach(function(feature) {
      layer.data_layer.overrideStyle(feature, {
        icon: '/images/map_icons/'+type+'.png',
      });
    });
    layer.show();
  });

}]);
