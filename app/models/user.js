// User
'use strict'

var helpers = require('../helpers')
var database = helpers.database
var config = helpers.config
var errors = require('node-errors')
var bcrypt = require('bcryptjs')
var crypto = require('crypto')
var querystring = require('querystring')
var validate = helpers.validate
var dedent = require('dedent')
var pify = require('pify')
var stringify = pify(require('csv-stringify'))
var pync = require('pync')

module.exports = class User {

  static hashPassword (pass) {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(10, (err, salt) => {
        if (err) return reject(err)
        bcrypt.hash(pass, salt, (err, hash) => {
          err ? reject(err) : resolve(hash)
        })
      })
    })
  }

  static getUsersCount() {
    return database.query('SELECT COUNT(*) FROM auth.users');
  }

  static checkPassword (plain, hash) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(plain, hash, (err, ok) => {
        err ? reject(err) : resolve(ok)
      })
    })
  }

  static login (email, password) {
    var sql = 'SELECT id, first_name, last_name, email, password, rol, company_name FROM auth.users WHERE email=$1'
    var user

    return database.findOne(sql, [email.toLowerCase()])
      .then((_user) => {
        user = _user
        if (!user) {
          return Promise.reject(errors.request('No user found with that email (%s)', email))
        }
        if (!user.password) return false
        return this.checkPassword(password, user.password)
      })
      .then((res) => {
        if (!res) {
          return Promise.reject(errors.forbidden('Invalid password'))
        }
        delete user.password
        return user
      })
  }

  static findByEmail (email) {
    return database.findOne('SELECT id, first_name, last_name, email FROM auth.users WHERE email=$1', [email.toLowerCase()])
  }

  static find () {
    return database.query(`
      SELECT *,
      CASE WHEN reset_code IS NOT NULL AND reset_code_expiration > NOW() THEN
        $1 || '/reset_password?code=' || reset_code
      ELSE NULL END
      AS resend_link
      FROM auth.users
    `, [config.base_url])
  }

  static deleteUser (user_id) {
    return database.execute('DELETE FROM auth.users WHERE id=$1', [user_id])
  }

  static changeRol (user_id, rol) {
    return database.execute('UPDATE auth.users SET rol=$2 WHERE id=$1', [user_id, rol])
  }

  static register (user) {
    var code = user.password ? null : this.randomCode()
    var hashedPassword = null

    return validate((expect) => {
      expect(user, 'user', 'object')
      expect(user, 'user.firstName', 'string')
      expect(user, 'user.lastName', 'string')
      expect(user, 'user.email', 'string')
    })
    .then(() => user.password ? this.hashPassword(user.password) : null)
    .then((hash) => {
      hashedPassword = hash;
      return database.query('INSERT INTO auth.system_actor(actor_type, is_deleted) VALUES (2, false);')
    })
    .then(() => {
      var params = [
        user.firstName,
        user.lastName,
        user.email.toLowerCase(),
        user.companyName || null,
        user.rol || null,
        hashedPassword || code
      ]
      var sql
      if (hashedPassword) {
        sql = `
          INSERT INTO auth.users (id, first_name, last_name, email, company_name, rol, password)
          VALUES ((SELECT MAX(id) FROM auth.system_actor), $1, $2, $3, $4, $5, $6) RETURNING id
        `
        return database.findOne(sql, params)
      } else {
        sql = `
          INSERT INTO auth.users (id, first_name, last_name, email, company_name, rol, reset_code, reset_code_expiration)
          VALUES ((SELECT MAX(id) FROM auth.system_actor), $1, $2, $3, $4, $5, $6, (NOW() + interval \'1 day\'))
          RETURNING id
        `
        return database.findOne(sql, params)
      }
    })
    .then((row) => (
      database.findOne('SELECT id, first_name, last_name, email FROM auth.users WHERE id=$1', [row.id])
    ))
    .then((usr) => {
      if (!user.password) {
        var email = user.email
        var base_url = config.base_url
        var url = base_url + '/reset_password?' + querystring.stringify({ code: code })
        var text = 'Follow the link below to set your password\n' + url

        helpers.mail.sendMail({
          subject: 'Set password',
          to: email,
          text: text
        })
        console.log('Reset link:', url)
      }
      return usr
    })
    .catch((err) => {
      if (err.message.indexOf('duplicate key') >= 0) {
        return Promise.reject(errors.request('There\'s already a user with that email address (%s)', user.email))
      }
      return Promise.reject(err)
    })
  }

  static find_by_id (id) {
    return database.findOne(`
        SELECT id, first_name, last_name, email, rol, company_name, default_location
        FROM auth.users WHERE id=$1
      `, [id])
  }

  static find_by_text (text) {
    text = '%' + text + '%'
    return database.query(`
        SELECT id, first_name, last_name, email
        FROM auth.users
        WHERE
            first_name LIKE $1
          OR last_name LIKE $1
          OR email LIKE $1
      `, [text])
  }

  static randomCode () {
    var rnd = crypto.randomBytes(32).toString('hex')
    User.latest_code = rnd
    return rnd
  }

  static forgotPassword (email) {
    email = email && email.toLowerCase()

    return Promise.resolve()
      .then(() => (
        database.findOne('SELECT id, email FROM auth.users WHERE email=$1', [email])
      ))
      .then((user) => {
        if (!user) return Promise.reject(errors.notFound('No user found with email `%s`', email))
        this.sendLink(user)
      })
  }

  static resendLink (user_id) {
    return Promise.resolve()
      .then(() => (
        database.findOne('SELECT id, email FROM auth.users WHERE id=$1', [user_id])
      ))
      .then((user) => {
        if (!user) return Promise.reject(errors.notFound('No user found with user_id `%s`', user_id))
        this.sendLink(user)
      })
  }

  static sendLink (user) {
    var code = this.randomCode()
    var sql = `
      UPDATE auth.users
      SET reset_code=$1, reset_code_expiration=(NOW() + interval \'1 day\')
      WHERE id=$2
    `
    return database.execute(sql, [code, user.id])
      .then(() => {
        var base_url = config.base_url
        var text = dedent`
          You're receiving this email because a password reset was requested for your user account in the ${config.client_carrier_name} ARO platform

          Follow the link below to reset your password
          ${base_url + '/reset_password?' + querystring.stringify({ code: code })}

          Please do not reply to this email. It was automatically generated.
        `
        helpers.mail.sendMail({
          subject: 'Password reset: ARO Application',
          to: user.email,
          text: text
        })
      })
  }

  static resetPassword (code, password) {
    var id
    return Promise.resolve()
      .then(() => (
        database.findOne(`
            SELECT id FROM auth.users
            WHERE reset_code=$1 AND reset_code_expiration > NOW()
          `, [code])
      ))
      .then((user) => {
        if (!user) return Promise.reject(errors.notFound('Reset code not found or expired'))
        id = user.id
        return this.hashPassword(password)
      })
      .then((hash) => database.execute(`
          UPDATE auth.users
          SET password=$1, reset_code=NULL WHERE id=$2
        `, [hash, id]))
  }

  static updateSettings (id, firstName, lastName, email) {
    var sql = 'UPDATE auth.users SET first_name=$1, last_name=$2, email=$3 WHERE id=$4'
    return database.findOne(sql, [firstName, lastName, email, id])
  }

  static changePassword (id, old_password, password) {
    return Promise.resolve()
      .then(() => (
        database.findOne('SELECT password FROM auth.users WHERE id=$1', [id])
      ))
      .then((user) => (
        user
          ? this.checkPassword(old_password, user.password)
          : Promise.reject(errors.request('User not found'))
      ))
      .then((res) => (
        res
          ? this.hashPassword(password)
          : Promise.reject(errors.forbidden('Invalid old password'))
      ))
      .then((hash) => (
        database.findOne('UPDATE auth.users SET password=$1 WHERE id=$2', [hash, id])
      ))
  }

  static downloadCSV () {
    var rows = [['First name', 'Last name', 'email']]
    return database.query('SELECT * FROM auth.users')
      .then((users) => {
        users.forEach((user) => {
          rows.push([user.first_name, user.last_name, user.email])
        })
        return stringify(rows)
      })
  }

  static sendMail (subject, text) {
    return database.query('SELECT * FROM auth.users')
      .then((users) => (
        pync.series(users, (user) => {
          // do not return the promise. We don't wait
          helpers.mail.sendMail({
            subject: subject,
            to: user.email,
            text: text
          })
        })
      ))
  }

  static setDefaultLocation(location, userId) {

    var sql = `
    UPDATE auth.users 
    SET default_location = $1
    WHERE id = $2
  `
    return database.findOne(sql, [location, userId])
  }

}
