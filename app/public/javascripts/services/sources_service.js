app.service('sources', function() {
  var sources = [];

  sources.add = function(source) {
    sources.push(source)
  };

  return sources;
});