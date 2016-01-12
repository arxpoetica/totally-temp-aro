// Map Layers
app.service('map_layers', function($rootScope) {

  var map_layers = {}
  var feature_layers = map_layers.feature_layers = {};
  var equipment_layers = map_layers.equipment_layers = {}; // used in equipment_nodes_controller

  map_layers.addFeatureLayer = function(layer) {
    feature_layers[layer.type] = layer;
  };

  map_layers.getFeatureLayer = function(type) {
    return feature_layers[type];
  };

  map_layers.addEquipmentLayer = function(layer) {
    var old = equipment_layers[layer.type];
    if (old) {
      old.remove();
    }
    equipment_layers[layer.type] = layer;
  };

  map_layers.removeEquipmentLayer = function(type) {
    var layer = equipment_layers[type];
    if (!layer) return;
    layer.remove();
    delete equipment_layers[type];
  };

  map_layers.getEquipmentLayer = function(type) {
    return equipment_layers[type];
  };

  // one infowindow for all layers
  var infoWindow = new google.maps.InfoWindow();
  $rootScope.infoWindow = infoWindow;

  var events = [
    'bounds_changed',
    'center_changed',
    'click',
    'dblclick',
    'drag',
    'dragend',
    'dragstart',
    'heading_changed',
    'idle',
    'maptypeid_changed',
    'mousemove',
    'mouseout',
    'mouseover',
    'projection_changed',
    'resize',
    'rightclick',
    'tilesloaded',
    'tilt_changed',
    'zoom_changed',
    'mousedown',
    'mouseup',
  ];

  google.maps.event.addDomListener(window, 'load', function() {
    events.forEach(function(eventName) {
      google.maps.event.addListener(map, eventName, function(event) {
        $rootScope.$broadcast('map_'+eventName, event);
      });
    });
  });

  var lastTime = null;

  $rootScope.$on('map_idle', function() {
    if (lastTime) {
      console.log(`It took ${Date.now() - lastTime} ms to zoom`);
      lastTime = null;
    }
  });

  $rootScope.$on('map_zoom_changed', function() {
    lastTime = Date.now();
  });

  return map_layers;

});
