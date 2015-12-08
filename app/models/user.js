// User

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');
var errors = require('node-errors');
var bcrypt = require('bcryptjs');
var validate = helpers.validate;

var User = {};

function hashPassword(pass, callback) {
  txain(function(callback) {
    bcrypt.genSalt(10, callback);
  })
  .then(function(salt, callback) {
    bcrypt.hash(pass, salt, callback)
  })
  .end(callback);
}

function checkPassword(plain, hash, callback) {
  bcrypt.compare(plain, hash, callback);
}

User.login = function(email, password, callback) {
  var sql = 'SELECT id, first_name, last_name, email, password FROM auth.users WHERE email=$1';
  var user;

  txain(function(callback) {
    database.findOne(sql, [email.toLowerCase()], callback);
  })
  .then(function(_user, callback) {
    user = _user;
    if (!user) {
      return callback(errors.request('No user found with that email (%s)', email));
    }
    checkPassword(password, user.password, callback);
  })
  .then(function(res, callback) {
    if (!res) {
      return callback(errors.forbidden('Invalid password'));
    }
    delete user.password;
    callback(null, user);
  })
  .end(callback);
};

User.find_by_email = function(email, callback) {
  var sql = 'SELECT id, first_name, last_name, email FROM auth.users WHERE email=$1';
  database.findOne(sql, [email.toLowerCase()], callback);
};

User.register = function(user, callback) {
  var user;

  validate(function(expect) {
    expect(user, 'user', 'object');
    expect(user, 'user.first_name', 'string');
    expect(user, 'user.last_name', 'string');
    expect(user, 'user.email', 'string');
    expect(user, 'user.password', 'string');
  }, function() {
    txain(function(callback) {
      hashPassword(user.password, callback);
    })
    .then(function(hash, callback) {
      var params = [
        user.first_name,
        user.last_name,
        user.email.toLowerCase(),
        hash,
      ];
      var sql = 'INSERT INTO auth.users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id';
      database.findOne(sql, params, callback);
    })
    .then(function(row, callback) {
      var sql = 'SELECT id, first_name, last_name, email FROM auth.users WHERE id=$1';
      database.findOne(sql, [row.id], callback);
    })
    .end(function(err, usr) {
      if (err && err.message.indexOf('duplicate key') >= 0) return callback(errors.request('There\'s already a user with that email address (%s)', user.email));
      if (err) return callback(err);
      return callback(null, usr);
    });
  }, callback);
};

User.find_by_id = function(id, callback) {
  var sql = 'SELECT id, first_name, last_name, email FROM auth.users WHERE id=$1';
  database.findOne(sql, [id], callback);
};

User.find_by_text = function(text, callback) {
  text = '%'+text+'%';
  var sql = 'SELECT id, first_name, last_name, email FROM auth.users WHERE first_name LIKE $1 OR last_name LIKE $1 OR email LIKE $1';
  database.query(sql, [text], callback);
}

module.exports = User;
