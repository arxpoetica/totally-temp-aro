app.service('selection', function($http) {

  var selection = {};

  function add_selection_collection(name) {
    var collection = [];
    collection.add = function(id, feature) {
      collection.push(id);
      selection[name] = _.uniq(collection);
    };
    collection.remove = function(id, feature) {
      var i = _.indexOf(collection, id);
      if (i >= 0) {
        collection.splice(i, 1);
        selection[name] = _.uniq(collection);
      }
    };
    selection[name] = collection;
  }

  add_selection_collection('sources');
  add_selection_collection('targets');

  return selection;

});
