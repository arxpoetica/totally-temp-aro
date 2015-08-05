// Equipment Nodes Controller
app.controller('equipment_nodes_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', function($scope, $rootScope, $http, selection, map_tools) {
  // Controller instance variables
  $scope.map_tools = map_tools;
  $scope.node_type = 'splice_point';

  var nodes_added = [];
  var icons = {
    splice_point: '/images/stock_icons/letter_s.png',
    fiber_deployment_hub: '/images/stock_icons/letter_h.png',
    fiber_deployent_terminal: '/images/stock_icons/letter_t.png',
  };

  /************
  * FUNCTIONS *
  *************/

  $scope.save_nodes = function() {

  };

  $scope.clear_nodes = function() {

  };

  $rootScope.$on('map_click', function(e, gm_event) {
    if (map_tools.is_visible('equipment_nodes')) {
      var type = $scope.node_type;
      var coordinates = gm_event.latLng;
      var feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [ coordinates.lng(), coordinates.lat() ],
        }
      };
      nodes_added.push(feature);
      var layer = $rootScope.feature_layers.network_nodes;
      var arr = layer.data_layer.addGeoJson(feature);
      arr.forEach(function(feature) {
        layer.data_layer.overrideStyle(feature, {
          icon: icons[type],
        });
      });
      layer.show();
    }
  });

}]);
