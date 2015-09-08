// Permission

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');

var Permission = {};

Permission.grant_access = function(route_id, user_id, rol, callback) {
  txain(function(callback) {
    var sql = 'DELETE FROM custom.permissions WHERE route_id=$1 AND user_id=$2';
    database.execute(sql, [route_id, user_id], callback);
  })
  .then(function(callback) {
    var sql = 'INSERT INTO custom.permissions (route_id, user_id, rol) VALUES ($1, $2, $3)';
    database.execute(sql, [route_id, user_id, rol], callback);
  })
  .end(callback);
};

Permission.revoke_access = function(route_id, user_id, callback) {
  var sql = 'DELETE FROM custom.permissions WHERE route_id=$1 AND user_id=$2';
  database.execute(sql, [route_id, user_id], callback);
};

module.exports = Permission;
