// User

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');
var errors = require('node-errors');
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var querystring = require('querystring');
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
  var sql = 'SELECT id, first_name, last_name, email, password, rol, company_name FROM auth.users WHERE email=$1';
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

User.find = function(callback) {
  var sql = 'SELECT * FROM auth.users';
  database.query(sql, callback);
};

User.delete_user = function(user_id, callback) {
  var sql = 'DELETE FROM auth.users WHERE id=$1';
  database.execute(sql, [user_id], callback);
};

User.register = function(user, callback) {
  var code = randomCode();

  validate(function(expect) {
    expect(user, 'user', 'object');
    expect(user, 'user.first_name', 'string');
    expect(user, 'user.last_name', 'string');
    expect(user, 'user.email', 'string');
  }, function() {
    txain(function(callback) {
      if (!user.password) return callback();
      hashPassword(user.password, callback);
    })
    .then(function(hash, callback) {
      var params = [
        user.first_name,
        user.last_name,
        user.email.toLowerCase(),
        user.company_name || null,
        user.rol || null,
        hash || code,
      ];
      if (hash) {
        var sql = 'INSERT INTO auth.users (first_name, last_name, email, company_name, rol, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
        database.findOne(sql, params, callback);
      } else {
        var sql = 'INSERT INTO auth.users (first_name, last_name, email, company_name, rol, reset_code, reset_code_expiration) VALUES ($1, $2, $3, $4, $5, $6, (NOW() + interval \'1 day\')) RETURNING id';
        database.findOne(sql, params, callback);
      }
    })
    .then(function(row, callback) {
      var sql = 'SELECT id, first_name, last_name, email FROM auth.users WHERE id=$1';
      database.findOne(sql, [row.id], callback);
    })
    .end(function(err, usr) {
      if (err && err.message.indexOf('duplicate key') >= 0) return callback(errors.request('There\'s already a user with that email address (%s)', user.email));
      if (err) return callback(err);
      if (!user.password) {
        var email = user.email;
        var base_url = process.env.APP_BASE_URL || 'http://localhost:8000'
        var url = base_url+'/reset_password?'+querystring.stringify({ code: code })
        var text = 'Follow the link below to set your password\n'+url;

        helpers.mail.sendMail({
          subject: 'Set password',
          to: email,
          text: text,
        });
        console.log('Reset link:', url);
      }
      return callback(null, usr);
    });
  }, callback);
};

User.find_by_id = function(id, callback) {
  var sql = 'SELECT id, first_name, last_name, email, rol, company_name FROM auth.users WHERE id=$1';
  database.findOne(sql, [id], callback);
};

User.find_by_text = function(text, callback) {
  text = '%'+text+'%';
  var sql = 'SELECT id, first_name, last_name, email FROM auth.users WHERE first_name LIKE $1 OR last_name LIKE $1 OR email LIKE $1';
  database.query(sql, [text], callback);
}

function randomCode() {
  return crypto.randomBytes(32).toString('hex');
}

User.forgot_password = function(email, callback) {
  var code = randomCode();

  txain(function(callback) {
    var sql = 'SELECT id FROM auth.users WHERE email=$1';
    database.findOne(sql, [email], callback);
  })
  .then(function(user, callback) {
    if (!user) return callback(errors.notFound('No user found with email `%s`', email));
    var sql = 'UPDATE auth.users SET reset_code=$1, reset_code_expiration=(NOW() + interval \'1 day\') WHERE id=$2';
    database.execute(sql, [code, user.id], callback);
  })
  .then(function(callback) {
    var base_url = process.env.APP_BASE_URL || 'http://localhost:8000'
    var text = 'Follow the link below to reset your password\n';
    text += base_url+'/reset_password?'+querystring.stringify({ code: code });

    helpers.mail.sendMail({
      subject: 'Reset password',
      to: email,
      text: text,
    })
    callback();
  })
  .end(callback);
}

User.reset_password = function(code, password, callback) {
  var id;
  txain(function(callback) {
    var sql = 'SELECT id FROM auth.users WHERE reset_code=$1 AND reset_code_expiration > NOW()';
    database.findOne(sql, [code], callback);
  })
  .then(function(user, callback) {
    if (!user) return callback(errors.notFound('Reset code not found or expired'));
    id = user.id
    hashPassword(password, callback);
  })
  .then(function(hash, callback) {
    var sql = 'UPDATE auth.users SET password=$1, reset_code=NULL WHERE id=$2';
    database.execute(sql, [hash, id], callback);
  })
  .end(callback);
}

User.change_password = function(id, old_password, password, callback) {
  txain(function(callback) {
    var sql = 'SELECT password FROM auth.users WHERE id=$1';
    database.findOne(sql, [id], callback);
  })
  .then(function(user, callback) {
    if (!user) {
      return callback(errors.request('User not found'));
    }
    checkPassword(old_password, user.password, callback);
  })
  .then(function(res, callback) {
    if (!res) {
      return callback(errors.forbidden('Invalid old password'));
    }
    hashPassword(password, callback);
  })
  .then(function(hash, callback) {
    var sql = 'UPDATE auth.users SET password=$1 WHERE id=$2';
    database.findOne(sql, [hash, id], callback);
  })
  .end(callback);
}

module.exports = User;
