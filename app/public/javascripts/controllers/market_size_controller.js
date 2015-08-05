// Market Size Controller
app.controller('market_size_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', function($scope, $rootScope, $http, selection, map_tools) {
  // Controller instance variables
  $scope.map_tools = map_tools;

  /************
  * FUNCTIONS *
  *************/

  // Listen for visibility toggle to be broadcast through $rootScope from other controller (map_tools_controller)
  $rootScope.$on('map_tool_changed_visibility', function(e, tool) {
    if (tool === 'market_size') {
      $rootScope.area_layers.census_blocks_layer.set_highlighteable(map_tools.is_visible('market_size'));
    }
  });

  $rootScope.$on('map_layer_clicked_feature', function(e, event, layer) {
    if (layer.type === 'census_blocks' && map_tools.is_visible('market_size')) {
      console.log('selected census block gid =', event.feature.getProperty('id'));
      // TODO: load data for this census_block
    }
  });


}]);
