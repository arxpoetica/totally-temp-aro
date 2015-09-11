var _ = require('underscore');

function expect(obj, path, type) {
  var comps = [];
  var attrs = path.split('.');
  attrs.forEach(function(comp) {
    var attr = comps.length === 0 ? obj : obj[comp];
    comps.push(comp);
    if (comps.length === attrs.length) {
      var func = 'is' + type.substring(0, 1).toUpperCase() + type.substring(1);
      if (!_[func](attr)) {
        throw new Error('Expected '+comps.join('.')+' to be of type '+type);
      }
    } else {
      if (!_.isObject(attr)) {
        throw new Error('Expected '+comps.join('.')+' to be an object');
      }
    }
    obj = attr;
  });
}

module.exports = function(validations, success, callback) {
  try {
    validations(expect);
    success();
  } catch (e) {
    callback(e);
  }
};
