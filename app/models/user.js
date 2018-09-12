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
const ldap = require('ldapjs')
var models = require('../models')
const authenticationConfigPromise = models.Authentication.getConfig('ldap')

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

  // Perform a LDAP binding to authenticate the user with given credentials
  static ldapBind(ldapClient, distinguishedName, password) {
    return new Promise((resolve, reject) => {
      // Time out if the LDAP bind fails (setting timeout on the client does not help).
      // The LDAP server may be unreachable, or may not be sending a response.
      setTimeout(() => reject('LDAP bind timed out'), 4000)
      ldapClient.bind(distinguishedName, password, (err) => {
        if (err) {
          reject(err) // There was an error binding with the given credentials
        }
        resolve() // Successfully bound with the given credentials
      })
    })
  }

  // Retrieve details of a successfully logged in LDAP user
  static ldapGetUserNames(ldapClient, username) {
    // We assume that the ldapClient has been successfully bound at this point.
    return new Promise((resolve, reject) => {
      authenticationConfigPromise
        .then((authenticationConfig) => {
          // Time out if the LDAP bind fails (setting timeout on the client does not help).
          // The LDAP server may be unreachable, or may not be sending a response.
          setTimeout(() => reject('ldapGetUserNames(): LDAP bind timed out'), 8000)
          const ldapOpts = {
            filter: `CN=${username}`,
            scope: 'sub',
            attributes: [authenticationConfig.firstNameAttribute, authenticationConfig.lastNameAttribute]
          };
          ldapClient.search(authenticationConfig.base, ldapOpts, (err, search) => {
            if (err) {
              reject(err) // There was an error when performing the search
            }
            search.on('searchEntry', (entry) => {
              resolve({
                firstName: entry.object[authenticationConfig.firstNameAttribute],
                lastName: entry.object[authenticationConfig.lastNameAttribute]
              })
            })
            search.on('error', (err) => reject(err))
          })
        })
    })
  }

  // Retrieve details of a successfully logged in LDAP user
  static ldapGetGroupsForUser(ldapClient, username) {
    // We assume that the ldapClient has been successfully bound at this point.
    return new Promise((resolve, reject) => {
      authenticationConfigPromise
        .then((authenticationConfig) => {
          // Time out if the LDAP bind fails (setting timeout on the client does not help).
          // The LDAP server may be unreachable, or may not be sending a response.
          setTimeout(() => {
            // NOTE: We are not rejecting in case of timeouts for getting groups
            console.log('ldapGetGroupsForUser(): LDAP bind timed out')
            resolve({ ldapGroups: [] })
          }, 8000)
          const ldapOpts = {
            filter: `CN=${username}`,
            scope: 'sub',
            attributes: [authenticationConfig.groupsAttribute]
          };
          ldapClient.search(authenticationConfig.base, ldapOpts, (err, search) => {
            if (err) {
              // NOTE: We are resolving with an empty list of groups, don't want an error in group
              // search to stop the user from logging in
              resolve({ ldapGroups: [] })
            }
            search.on('searchEntry', (entry) => {
              resolve({
                ldapGroups: [entry.object[authenticationConfig.groupsAttribute]]
              })
            })
            search.on('error', (err) => {
              // NOTE: We are resolving with an empty list of groups, don't want an error in group
              // search to stop the user from logging in
              console.log('ERROR when performing ldap search')
              console.log(err)
              resolve({ ldapGroups: [] })
            })
          })
        })
    })
  }

  // Create a new user
  static createUser(firstName, lastName, email, password, ldapGroups) {
    const getGroups = ldapGroups 
                      ? database.query(`SELECT auth_group_id FROM auth.external_group_mapping WHERE external_group_name IN ($1)`, [ldapGroups])
                      : Promise.resolve([])
    getGroups
      .then((aroGroups) => {
        var createUserRequest = {
          method: 'POST',
          url: `${config.aro_service_url}/auth/users`,
          body: {
            email: email,
            firstName: firstName,
            lastName: lastName,
            fullName: `${firstName} ${lastName}`,
            rol: 'admin',
            groupIds: aroGroups.map((item) => item.auth_group_id)
          },
          json: true
        }
        return models.AROService.request(createUserRequest)
      })
      .then(() => {
        return this.hashPassword(password)
      })
      .then((hashedPassword) => {
        // Update the details for this user. Note that aro-service ignores the password field so it will not be set
        const sql = `
          UPDATE auth.users
          SET password = '${hashedPassword}'
          WHERE email='${email}';
        `
        return database.query(sql);
      })
  }

  // Find or create a user
  static findOrCreateUser(userDetails, email, password) {
    return database.query(`SELECT * FROM auth.users WHERE email='${email}'`)
      .then((user) => {
        return user.length > 0 ? Promise.resolve() : this.createUser(userDetails.firstName, userDetails.lastName, email, password, userDetails.ldapGroups)
      })
  }

  static loginLDAP(username, password) {

    var ldapClient = null, userDetails = {}
    return authenticationConfigPromise
      .then((authenticationConfig) => {
        // Create a LDAP client that we will user for authentication
        ldapClient = ldap.createClient({
          url: authenticationConfig.url
        });
        ldapClient.on('error', (err) => {
          console.error('Error from ldap client:')
          console.log(err)
        })
        // Create a Distinguished Name (DN) that we represents the user that is trying to login
        const distinguishedName = authenticationConfig.distinguishedName.replace('$USERNAME$', username)
        return this.ldapBind(ldapClient, distinguishedName, password)
      })
      .then(() => this.ldapGetUserNames(ldapClient, username))
      .then((details) => {
        userDetails.firstName = details.firstName
        userDetails.lastName = details.lastName
        return this.ldapGetGroupsForUser(ldapClient, username)
      })
      .then((details) => {
        // Why not get the groups at the same time as first/last name? Because in case group membership is not
        // found, we still want to allow the user to log in.
        userDetails.ldapGroups = details.ldapGroups
        return this.findOrCreateUser(userDetails, username, password)
      })
      .then(() => new Promise((resolve, reject) => {setTimeout(() => resolve(), 2000)}))
      .then(() => {
        var sql = 'SELECT id, first_name, last_name, email, password, rol, company_name FROM auth.users WHERE email=$1'
        return database.findOne(sql, [username])
      })
      .then((user) => {
        delete user.password
        return user
      })
      .catch((err) => {
        console.error('**** Error when logging in with LDAP')
        console.error(err)
        return Promise.reject(err)
      })
  }

  static login (email, password) {
    var sql = 'SELECT id, first_name, last_name, email, password, rol, company_name FROM auth.users WHERE LOWER(email)=$1'
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
    return database.execute(`DELETE FROM auth.user_auth_group WHERE user_id=$1`, [user_id])
      .then(() => database.execute('DELETE FROM auth.users WHERE id=$1', [user_id]))
  }

  static changeRol (user_id, rol) {
    return database.execute('UPDATE auth.users SET rol=$2 WHERE id=$1', [user_id, rol])
  }

  // Registers a user with a password
  static registerWithPassword(user, addToPublicGroup, clearTextPassword) {
    if (!clearTextPassword || clearTextPassword == '') {
      return Promise.reject('You must specify a password for registering the user')
    }
    return this.hashPassword(clearTextPassword)
      .then((hashedPassword) => this.register(user, addToPublicGroup, hashedPassword))
  }

  // Registers a user without a password
  static registerWithoutPassword(user) {
    return this.register(user, true, null)
  }
    
  static register(user, addToPublicGroup, hashedPassword) {

    var createdUserId = null;
    return validate((expect) => {
      expect(user, 'user', 'object')
      expect(user, 'user.firstName', 'string')
      expect(user, 'user.lastName', 'string')
      expect(user, 'user.email', 'string')
    })
    .then(() => database.query(`SELECT auth.add_user('${user.firstName}', '${user.lastName}', '${user.email}');`))
    .then((createdUser) => {
      createdUserId = createdUser[0].add_user
      var full_name = user.firstName + ' ' + user.lastName
      var setString = `company_name='${user.companyName}', rol='${user.rol}', full_name='${full_name}'`
      if (hashedPassword) {
        setString += `, password='${hashedPassword}'` // Set the password only if it is specified
      }
      return database.query(`UPDATE auth.users SET ${setString} WHERE id=${createdUserId};`)
    })
    .then(() => {
      // If password has been set, no need to send a reset email
      return hashedPassword ? Promise.resolve() : this.resendLink(createdUserId)
    })
    .then(() => {
      // Note that addToPublicGroup can be false, if we are calling this from an ETL script (in which case we do not
      // have access to aro-service at that point)
      return addToPublicGroup ? this.addUserToGroup(user.email, 'Public') : Promise.resolve()
    })
    .then(() => Promise.resolve(createdUserId))
    .catch((err) => {
      if (err.message.indexOf('duplicate key') >= 0) {
        return Promise.reject(errors.request('There\'s already a user with that email address (%s)', user.email))
      }
      return Promise.reject(err)
    })
  }

  // Used to set administrator permissions for a user in the new permissions schema
  static addUserToGroup(email, groupName) {

    var userId = null, groupId = null
    return Promise.all([
      database.query(`SELECT id FROM auth.users WHERE email='${email}'`),
      database.query(`SELECT id FROM auth.auth_group WHERE name='${groupName}'`)
    ])
      .then((results) => {
        userId = results[0][0].id
        groupId = results[1][0].id
        // Get the user details from aro-service
        var getUserDetails = {
          method: 'GET',
          url: `${config.aro_service_url}/auth/users/${userId}`
        }
        return models.AROService.request(getUserDetails)
      })
      .then((result) => {
        var serviceUser = JSON.parse(result)
        // Add the group id to the user, and save it back to aro-service
        if (serviceUser.groupIds.indexOf(groupId) < 0) {
          serviceUser.groupIds.push(groupId)
        }
        var putUserDetails = {
          method: 'PUT',
          url: `${config.aro_service_url}/auth/users`,
          body: serviceUser,
          json: true
        }
        return models.AROService.request(putUserDetails)
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
          You're receiving this email because a password reset was requested for your user account in the ARO platform

          Follow the link below to reset your password
          ${base_url + '/reset_password?' + querystring.stringify({ code: code })}

          Please do not reply to this email. It was automatically generated.
        `
        helpers.mail.sendMail({
          subject: 'Password reset: ARO Application',
          to: user.email,
          text: text
        })
        console.log('************************************** Password reset email **************************************')
        console.log(text)
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
}
