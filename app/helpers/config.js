var fs = require('fs');
var path = require('path');

var filename = path.join(__dirname, '..', '..', 'conf', 'config_app.json')

try {
  module.exports = require(filename);
  console.log('Loaded', filename, 'successfully')
} catch (e) {
  // default configuration
  module.exports = {
    database_url: 'postgres://aro:aro@localhost/aro',
  };
  console.log('File', filename, 'not found. Using default configuration')
}
