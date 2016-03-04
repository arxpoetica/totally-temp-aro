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
    return database.query('SELECT * FROM auth.users')
  }

  static deleteUser (user_id) {
    return database.execute('DELETE FROM auth.users WHERE id=$1', [user_id])
  }

  static register (user) {
    var code = user.password ? null : this.randomCode()

    return validate((expect) => {
      expect(user, 'user', 'object')
      expect(user, 'user.first_name', 'string')
      expect(user, 'user.last_name', 'string')
      expect(user, 'user.email', 'string')
    })
    .then(() => user.password ? this.hashPassword(user.password) : null)
    .then((hash) => {
      var params = [
        user.first_name,
        user.last_name,
        user.email.toLowerCase(),
        user.company_name || null,
        user.rol || null,
        hash || code
      ]
      var sql
      if (hash) {
        sql = `
          INSERT INTO auth.users (first_name, last_name, email, company_name, rol, password)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `
        return database.findOne(sql, params)
      } else {
        sql = `
          INSERT INTO auth.users (first_name, last_name, email, company_name, rol, reset_code, reset_code_expiration)
          VALUES ($1, $2, $3, $4, $5, $6, (NOW() + interval \'1 day\'))
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
        var base_url = process.env.APP_BASE_URL || 'http://localhost:8000'
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
        SELECT id, first_name, last_name, email, rol, company_name
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
    var code
    email = email && email.toLowerCase()

    return Promise.resolve()
      .then(() => (
        database.findOne('SELECT id FROM auth.users WHERE email=$1', [email])
      ))
      .then((user) => {
        if (!user) return Promise.reject(errors.notFound('No user found with email `%s`', email))
        code = this.randomCode()
        var sql = `
          UPDATE auth.users
          SET reset_code=$1, reset_code_expiration=(NOW() + interval \'1 day\')
          WHERE id=$2
        `
        return database.execute(sql, [code, user.id])
      })
      .then(() => {
        var base_url = process.env.APP_BASE_URL || 'http://localhost:8000'
        var text = dedent`
          You're receiving this email because a password reset was requested for your user account in the ${config.client_carrier_name} ARO platform

          Follow the link below to reset your password
          ${base_url + '/reset_password?' + querystring.stringify({ code: code })}

          Please do not reply to this email. It was automatically generated.
        `
        helpers.mail.sendMail({
          subject: 'Password reset: ARO Application',
          to: email,
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

}
