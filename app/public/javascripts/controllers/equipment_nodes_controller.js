// Equipment Nodes Controller
app.controller('equipment_nodes_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', function($scope, $rootScope, $http, selection, map_tools) {
  // Controller instance variables
  $scope.map_tools = map_tools;

  /************
  * FUNCTIONS *
  *************/

  $rootScope.$on('map_tool_changed_visibility', function(e, tool) {
    if (tool === 'equipment_nodes') {
      console.log('Should we let the user add equipment nodes to the map?', map_tools.is_visible('equipment_nodes'));
    }
  });

}]);
