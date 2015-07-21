app.service('selection', function($rootScope, $http) {

  var selection = {};
  var collectionNames = [];

  function add_selection_collection(name) {
    collectionNames.push(name);
    var arr = [];
    var collection = {};
    collection.add = function(id, feature) {
      // this is a quick workaround. For targets we need the vertex_id and the location_id
      if (name === 'targets') {
        id += ':' + feature.getProperty('id')
      }
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
    collection.join = function(str) {
      return arr.join(',')
    }
    collection.first = function() {
      return arr[0];
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
  }

  return selection;

});
