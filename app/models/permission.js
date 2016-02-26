// Permission

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');

var Permission = {};

Permission.grant_access = function(plan_id, user_id, rol, callback) {
  txain(function(callback) {
    var sql = 'DELETE FROM auth.permissions WHERE plan_id=$1 AND user_id=$2';
    database.execute(sql, [plan_id, user_id], callback);
  })
  .then(function(callback) {
    var sql = 'INSERT INTO auth.permissions (plan_id, user_id, rol) VALUES ($1, $2, $3)';
    database.execute(sql, [plan_id, user_id, rol], callback);
  })
  .end(callback);
};

Permission.revoke_access = function(plan_id, user_id, callback) {
  var sql = 'DELETE FROM auth.permissions WHERE plan_id=$1 AND user_id=$2';
  database.execute(sql, [plan_id, user_id], callback);
};

Permission.find_permission = function(plan_id, user_id, callback) {
  var sql = 'SELECT rol FROM auth.permissions WHERE plan_id=$1 AND user_id=$2';
  database.findOne(sql, [plan_id, user_id], callback);
};

module.exports = Permission;
