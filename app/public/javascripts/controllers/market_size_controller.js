// Market Size Controller
app.controller('market_size_controller', ['$scope', '$rootScope', '$http', 'selection', 'MapLayer', function($scope, $rootScope, $http, selection, MapLayer) {
  // Controller instance variables
  $scope.is_visible = false;

  /************
  * FUNCTIONS *
  *************/

  // Listen for visibility toggle to be broadcast through $rootScope from other controller (map_tools_controller)
  $rootScope.$on('toggle_market_size_visibility', function() {

    $scope.is_visible = !$scope.is_visible;
  });

  // Hide if DBR tool is selected and this is open
  $rootScope.$on('toggle_tool_visibility', function() {

    if($scope.is_visible){

      $scope.is_visible = !$scope.is_visible;
    }
  });

  $rootScope.$on('map_layer_clicked_feature', function(e, event, layer) {
    if (layer.type === 'census_blocks') {
      console.log('selected census block gid =', event.feature.getProperty('id'));
      // TODO: show market size tool and load the data
    }
  });


}]);
