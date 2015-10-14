// Fiber Plant Controller
app.controller('fiber_plant_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'MapLayer', function($scope, $rootScope, $http, map_tools, MapLayer) {

  $scope.map_tools = map_tools;
  $scope.carriers = [];

  var layers = [];

  $http.get('/network/carriers').success(function(carriers) {
    var hue = 0;
    var step = Math.floor(360 / carriers.length);
    $scope.carriers = carriers.map(function(carrier) {
      var obj = {
        name: carrier,
        color: 'hsl('+hue+', 100%, 30%)',
      }
      hue += step;
      return obj;
    });

    $scope.carriers.forEach(function(carrier) {
      
      layers[layer_name(carrier.name)] = new MapLayer({
        name: 'Fiber',
        short_name: 'F',
        api_endpoint: '/network/fiber_plant/'+encodeURIComponent(carrier.name),
        style_options: {
          normal: {
            strokeColor: carrier.color,
            strokeWeight: 2,
          }
        },
      });

    })
  });

  $scope.toggle_carrier = function(carrier) {
    layers[layer_name(carrier)].toggle_visibility();
  };

  function layer_name(carrier) {
    return 'fiber_plant_'+encodeURIComponent(carrier);
  }

}]);
