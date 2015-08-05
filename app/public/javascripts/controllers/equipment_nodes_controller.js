// Equipment Nodes Controller
app.controller('equipment_nodes_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', function($scope, $rootScope, $http, selection, map_tools) {
  // Controller instance variables
  $scope.map_tools = map_tools;
  $scope.node_type = 'splice_point';

  // TODO: fetch this information from the server
  var node_types = $scope.node_types = [
    { id: 1, name: 'central_office', description: 'Central Office' },
    { id: 2, name: 'splice_point', description: 'Splice Point' },
    { id: 3, name: 'fiber_deployment_hub', description: 'Fiber Deployment Hub' },
    { id: 4, name: 'fiber_deployent_terminal', description: 'Fiber Deployment Terminal' },
  ];

  function empty_changes() {
    return { insertions:[] };
  }

  var changes = empty_changes();
  var route = null;

  /************
  * FUNCTIONS *
  *************/

  $rootScope.$on('route_selected', function(e, _route) {
    route = _route;
  });

  $scope.save_nodes = function() {
    if (!route) return;

    $http.post('/network/nodes/'+route.id+'/edit', changes).success(function(response) {
      changes = empty_changes();
      $rootScope.feature_layers.network_nodes.reload_data(); // to get the ids so they can be selected
    });
  };

  $scope.clear_nodes = function() {
    if (!route) return;
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover the deleted data!",
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, clear them!",
      showCancelButton: true,
      closeOnConfirm: true,
    }, function() {
      console.log('bar')
      $http.post('/network/nodes/'+route.id+'/clear').success(function(response) {
        console.log('foo');
        $rootScope.feature_layers.network_nodes.reload_data();
      });
    });
  };

  $rootScope.$on('map_click', function(e, gm_event) {
    if (!map_tools.is_visible('equipment_nodes') || !route) return;

    var type = $scope.node_type;
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
