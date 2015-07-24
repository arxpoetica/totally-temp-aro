// Contextual Menu Controller
app.controller('contextual_menu_controller', function($scope, $rootScope) {

  function fromLatLngToPoint(latLng) {
    var projection = map.getProjection();
    var topRight = projection.fromLatLngToPoint(map.getBounds().getNorthEast());
    var bottomLeft = projection.fromLatLngToPoint(map.getBounds().getSouthWest());
    var scale = Math.pow(2, map.getZoom());
    var worldPoint = projection.fromLatLngToPoint(latLng);
    return new google.maps.Point((worldPoint.x - bottomLeft.x) * scale, (worldPoint.y - topRight.y) * scale);
  }

  var options = $scope.options = [];
  var callbackParameters = null;

  options.add = function(label, callback) {
    options.push({
      label: label,
      callback: callback,
    })
  }

  function show_contextual_menu(gm_event, event_name) {
    var pixel = fromLatLngToPoint(gm_event.latLng);
    options.splice(0, options.length);
    $rootScope.$broadcast.apply($rootScope, [event_name, options].concat(callbackParameters));
    $scope.$apply();
    if (options.length === 0) return;

    $('#contextual_menu').css({
      left: pixel.x+'px',
      top: pixel.y+'px',
      display: 'block',
    })
  }

  $rootScope.$on('map_rightclick', function(e, event) {
    callbackParameters = [event];
    show_contextual_menu(event, 'contextual_menu_map');
  });

  $rootScope.$on('map_layer_rightclicked_feature', function(e, event, map_layer, feature) {
    callbackParameters = [map_layer, event.feature];
    show_contextual_menu(event, 'contextual_menu_feature');
  });

  $rootScope.select_option = function(index) {
    var option = options[index];
    option && option.callback.apply(null, callbackParameters);
  }

  $('html').click(function() {
    $('#contextual_menu').css({
      display: 'none',
    });
  });

});