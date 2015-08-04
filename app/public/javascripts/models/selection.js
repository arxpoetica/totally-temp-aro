app.service('selection', function($rootScope, $http) {

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

    var feature_layers = $rootScope.feature_layers;
    for (var key in feature_layers) {
      if (feature_layers.hasOwnProperty(key)) {
        feature_layers[key].revert_styles();
      }
    }
  };

  selection.sync_selection = function() {
    var feature_layers = $rootScope.feature_layers;
    for (var key in feature_layers) {
      if (feature_layers.hasOwnProperty(key)) {
        feature_layers[key].sync_selection();
      }
    }
  };

  selection.set_enabled = function(_enabled) {
    enabled = _enabled;
  };

  selection.is_enabled = function() {
    return enabled;
  };

  return selection;

});
