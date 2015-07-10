app.service('targets', function() {
  var targets = [];

  targets.add = function(target) {
    targets.push(target)
  };

  return targets;
});