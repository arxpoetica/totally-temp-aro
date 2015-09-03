var fs = require('fs');
var path = require('path');

var filename = path.join(__dirname, '..', '..', 'conf', 'config_app.json')
var def_conf = path.join(__dirname, '..', '..', 'conf', 'config_app_default.json')

try {
  module.exports = require(filename);
  console.log('Loaded', filename, 'successfully');
} catch (e) {
  // default configuration
  module.exports = require(def_conf);
  console.log('File', filename, 'not found. Using default configuration file');
}
