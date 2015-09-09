// Boundaries Controller
app.controller('boundaries_controller', ['$scope', '$rootScope', '$http', 'selection', 'map_tools', function($scope, $rootScope, $http, selection, map_tools) {

  $scope.map_tools = map_tools;
  $scope.area_layers = $rootScope.area_layers;

  $scope.selected_tool = false;

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: false,
  });

  $rootScope.$on('map_tool_changed_visibility', function(e, tool) {
    if (!map_tools.is_visible('boundaries')) {
      drawingManager.setMap(null);
    }
  });

  $scope.toggle_tool = function() {
    $scope.selected_tool = !$scope.selected_tool;
    drawingManager.setMap($scope.selected_tool ? map : null);
  };

  drawingManager.addListener('overlaycomplete', function(e) {
    var overlay = e.overlay;
    setTimeout(function() {
      overlay.setMap(null);
    }, 100);
  });

}]);
