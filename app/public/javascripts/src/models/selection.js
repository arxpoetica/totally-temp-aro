app.service('selection', function($rootScope, map_layers) {

  var selection = {};
  var collectionNames = [];
  var enabled = false;

  function add_selection_collection(name) {
    collectionNames.push(name);
    var arr = [];
    var collection = {};
    collection.add = function(id, feature) {
      arr.push(id);
      arr = _.uniq(arr);
    };
    collection.remove = function(id, feature) {
      var i = _.indexOf(arr, id);
      if (i >= 0) {
        arr.splice(i, 1);
      }
    };
    collection.removeAll = function() {
      arr.splice(0, arr.length);
    }
    collection.length = function() {
      return arr.length;
    }
    collection.contains = function(id) {
      return arr.indexOf(id) >= 0;
    }
    selection[name] = collection;
  }

  add_selection_collection('sources');
  add_selection_collection('targets');

  selection.clear_selection = function() {
    collectionNames.forEach(function(name) {
      selection[name].removeAll();
    });

    var feature_layers = map_layers.feature_layers;
    for (var key in feature_layers) {
      if (feature_layers.hasOwnProperty(key)) {
        feature_layers[key].revert_styles();
        feature_layers[key].apply_filter();
      }
    }
  };

  selection.sync_selection = function() {
    var feature_layers = map_layers.feature_layers;
    for (var key in feature_layers) {
      if (feature_layers.hasOwnProperty(key)) {
        feature_layers[key].sync_selection();
      }
    }
  };

  selection.set_enabled = function(_enabled) {
    enabled = _enabled && config.route_planning;
  };

  selection.is_enabled = function() {
    return enabled;
  };

  $rootScope.$on('selection_tool_rectangle', function(e, overlay, deselect_mode) {
    var bounds = overlay.getBounds();
    map_layers.getFeatureLayer('locations').change_selection_for_features_matching(!deselect_mode, function(feature) {
      var latLng = feature.getGeometry().get();
      return bounds.contains(latLng);
    });
  });

  $rootScope.$on('selection_tool_polygon', function(e, overlay, deselect_mode) {
    map_layers.getFeatureLayer('locations').change_selection_for_features_matching(!deselect_mode, function(feature) {
      var latLng = feature.getGeometry().get();
      return google.maps.geometry.poly.containsLocation(latLng, overlay);
    });
  });

  return selection;

});
