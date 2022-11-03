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
var pify = require('pify')
var stringify = pify(require('csv-stringify'))
var pync = require('pync')
const ldap = require('ldapjs')
var models = require('../models')
var hstore = require('pg-hstore')()
const LoginStatus = require('./constants/loginStatus')
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
          console.log('LDAP: ldapBind() had an error:')
          console.log(err)
          reject(err) // There was an error binding with the given credentials
        }
        console.log('LDAP: ldapBind() was successful')
        resolve() // Successfully bound with the given credentials
      })
    })
  }

  // Retrieve details of a successfully logged in LDAP user
  static ldapGetAttributes(ldapClient, username, sessionDetails) {
    // We assume that the ldapClient has been successfully bound at this point.
    return new Promise((resolve, reject) => {
      authenticationConfigPromise
        .then((authenticationConfig) => {
          console.log('LDAP: ldapGetAttributes() config is')
          console.log(authenticationConfig)
          // Time out if the LDAP bind fails (setting timeout on the client does not help).
          // The LDAP server may be unreachable, or may not be sending a response.
          setTimeout(() => {
            sessionDetails.login_status_id = LoginStatus.LDAP_SERVER_TIMEOUT
            reject('ldapGetUserNames(): LDAP bind timed out')
          }, 8000)
          const ldapOpts = {
            filter: `CN=${username}`,
            scope: 'sub',
            attributes: [authenticationConfig.firstNameAttribute, authenticationConfig.lastNameAttribute, authenticationConfig.groupsAttribute]
          };
          console.log('LDAP: using ldapOpts')
          console.log(ldapOpts)
          ldapClient.search(authenticationConfig.base, ldapOpts, (err, search) => {
            if (err) {
              console.log('LDAP search returned error:')
              console.log(err)
              sessionDetails.login_status_id = LoginStatus.LDAP_ERROR_GETTING_ATTRIBUTES
              reject(err) // There was an error when performing the search
            }
            search.on('searchEntry', (entry) => {
              console.log('LDAP search returned success:')
              console.log(entry)
              console.log(entry.object)
              resolve({
                firstName: entry.object[authenticationConfig.firstNameAttribute],
                lastName: entry.object[authenticationConfig.lastNameAttribute],
                // Note that sometimes 'entry.object[authenticationConfig.groupsAttribute]' is a single string,
                // while sometimes it is an array of strings. Do a [].concat() so we always get back an array 
                ldapGroups: [].concat(entry.object[authenticationConfig.groupsAttribute])
              })
            })
            search.on('error', (err) => {
              console.log('LDAP search.on.error')
              console.log(err)
              sessionDetails.login_status_id = LoginStatus.UNDEFINED_ERROR
              reject(err)
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
    return getGroups
      .then((aroGroups) => {
        var createUserRequest = {
          method: 'POST',
          url: `${config.aro_service_url}/auth/users`,
          body: {
            email: email,
            firstName: firstName,
            lastName: lastName,
            fullName: `${firstName} ${lastName}`,
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
    // Make the LDAP username/email to upper case
    return database.query(`SELECT * FROM auth.users WHERE UPPER(email)=UPPER('${email}')`)
      .then((user) => {
        return user.length > 0 ? Promise.resolve() : this.createUser(userDetails.firstName, userDetails.lastName, email.toUpperCase(), password, userDetails.ldapGroups)
      })
  }

  static loginLDAP(username, password) {

    var ldapClient = null
    var sessionDetails = {
      login_status_id: LoginStatus.UNDEFINED_ERROR,
      attributes: {}
    }

    return authenticationConfigPromise
      .then((authenticationConfig) => {
        console.log('LDAP: authenticationConfig is')
        console.log(authenticationConfig)
        // Create a LDAP client that we will user for authentication
        ldapClient = ldap.createClient({
          url: authenticationConfig.url
        });
        ldapClient.on('error', (err) => {
          console.error('Error from ldap client:')
          console.log(err)
          sessionDetails.login_status_id = LoginStatus.UNDEFINED_ERROR
        })
        // Create a Distinguished Name (DN) that we represents the user that is trying to login
        const distinguishedName = authenticationConfig.distinguishedName.replace('$USERNAME$', username)
        return this.ldapBind(ldapClient, distinguishedName, password)
      })
      .then(() => {
        console.log('LDAP: Returned from ldapBind()')
        return this.ldapGetAttributes(ldapClient, username, sessionDetails)
      })
      .then((userDetails) => {
        console.log('LDAP: Returned from ldapGetAttributes(). userDetails is now')
        console.log(userDetails)
        return this.findOrCreateUser(userDetails, username, password)
      })
      .then(() => {
        console.log('LDAP: Returned from findOrCreateUser()')
        var sql = 'SELECT id, first_name, last_name, email, password, company_name FROM auth.users WHERE UPPER(email)=UPPER($1) ORDER BY id ASC'
        return database.findOne(sql, [username])
      })
      .then((user) => {
        // At this point the login is 'successful'. Cache the user password so that we can log in even when LDAP is offline.
        this.saveCachedPasswordForUser(username, password)   // Even if this fails, we should continue
        console.log('LDAP - returned from database.findOne()')
        delete user.password
        sessionDetails.login_status_id = LoginStatus.LOGIN_SUCCESSFUL_EXTERNAL_AUTH
        this.saveLoginAudit(user.id, sessionDetails)
        return user
      })
      .catch((err) => {
        console.error('**** Error when logging in with LDAP')
        console.error(err)
        return Promise.reject(err)
      })
  }

  static saveCachedPasswordForUser(email, password) {
    return this.hashPassword(password)
      .then((hashedPassword) => {
        const sql = `
          UPDATE auth.users
          SET password = '${hashedPassword}'
          WHERE email='${email}';
        `
        return database.query(sql)
      })
      .then(() => console.log(`LDAP - successfully updated cached password for user ${email}`))
      .catch((err) => {
        console.log(`LDAP - error when updating cached password for user ${email}`)
        console.log(err)
      })
  }

  static login (email, password) {
    var sql = `SELECT au.id, au.first_name, au.last_name, au.email, au.password, au.company_name
              FROM auth.users au
              JOIN auth.system_actor sa ON sa.id = au.id
              WHERE NOT sa.is_deleted AND LOWER(email)=$1`
    var user
    var sessionDetails = {
      login_status_id: LoginStatus.UNDEFINED_ERROR,
      attributes: {}
    }

    return database.findOne(sql, [email.toLowerCase()])
      .then((_user) => {
        user = _user
        if (!user) {
          return Promise.reject(errors.request('Invalid username or password'))
        }
        if (!user.password) return false
        return this.checkPassword(password, user.password)
      })
      .then((res) => {
        if (!res) {
          sessionDetails.login_status_id = LoginStatus.INCORRECT_PASSWORD
          this.saveLoginAudit(user.id, sessionDetails)
          return Promise.reject(errors.forbidden('Invalid username or password'))
        }
        delete user.password
        sessionDetails.login_status_id = LoginStatus.LOGIN_SUCCESSFUL_CACHED_PASSWORD
        this.saveLoginAudit(user.id, sessionDetails)
        return user
      })
  }

  static saveLoginAudit(userId, sessionDetails) {
    try {
      // At this point we say that the user has been logged in successfully. Save the login attempt.
      hstore.stringify(sessionDetails.attributes, (attributes) => {
        var sql = `INSERT INTO auth.user_session(actor_id, login_timestamp, login_status_id, attributes)
                  VALUES($1, $2, $3, $4);`
        database.query(sql, [userId, new Date(), sessionDetails.login_status_id, attributes])
      })
    } catch (err) {
      // We do not want to stop logins in case of any errors when saving session audits.
      console.error('ERROR when trying to save login audit:')
      console.error(err)
    }
  }

  static findByEmail (email) {
    return database.findOne('SELECT id, first_name, last_name, email FROM auth.users WHERE lower(email)=$1', [email.toLowerCase()])
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

  // Registers a user with a password
  static registerFromETL(user, clearTextPassword) {
    if (!clearTextPassword || clearTextPassword == '') {
      return Promise.reject('You must specify a password for registering the user')
    }
    return this.hashPassword(clearTextPassword)
      .then((hashedPassword) => this.register(user, hashedPassword, false))
  }

  // Registers a user without a password
  static registerWithoutPassword(user) {
    return this.register(user, null, true)
  }

  static addUserToGroup(email, groupId) {
    const sqlAddUserToGroup = `
      INSERT INTO auth.user_auth_group(user_id, auth_group_id)
      VALUES(
        (SELECT id FROM auth.users WHERE email='${email}'),
        ${groupId}
      );
    `
    return database.query(sqlAddUserToGroup)
  }

  // Note that this is also called from the ETL script, so we can't use aro-service here
  static register(user, hashedPassword, useAroService) {

    var createdUserId = null;
    return validate((expect) => {
      expect(user, 'user', 'object')
      expect(user, 'user.firstName', 'string')
      expect(user, 'user.lastName', 'string')
      expect(user, 'user.email', 'string')
    })
    .then(() => {
      if (useAroService) {
        var createUserRequest = {
          method: 'POST',
          url: `${config.aro_service_url}/auth/users`,
          body: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`,
            groupIds: user.groupIds || []
          },
          json: true
        }
        return models.AROService.request(createUserRequest)
          .then((result) => Promise.resolve(result))
      } else {
        return database.query(`SELECT auth.add_user('${user.firstName}', '${user.lastName}', '${user.email}');`)
          .then((result) => Promise.resolve({id: result[0].add_user}))
      }
    })
    .then((createdUser) => {
      createdUserId = createdUser.id
      var full_name = user.firstName + ' ' + user.lastName
      var setString = `company_name='${user.companyName}', full_name='${full_name}'`
      if (hashedPassword) {
        setString += `, password='${hashedPassword}'` // Set the password only if it is specified
      } else {
        // Password was not specified - try sending a reset link (will fail on localhost)
        this.resendLink(createdUserId)
          .catch((err) => console.error(err))
      }
      return database.query(`UPDATE auth.users SET ${setString} WHERE id=${createdUserId};`)
    })
    .then(() => {
      // If the "global super user" flag is set, then change that setting. Again, can't use service as this may be called from ETL.
      var superUserPromise = Promise.resolve()
      if (user.isGlobalSuperUser) {
        const sql = `
          INSERT INTO auth.global_actor_permission(actor_id, permissions)
          VALUES(
            (SELECT id FROM auth.users WHERE email='${user.email}'),
            31
          )
        `
        superUserPromise = database.query(sql, [])
      }
      return superUserPromise
    })
    .then(() => Promise.resolve(createdUserId))
    .catch((err) => {
      console.error('--------------------------------------------')
      console.error(err)
      if (err.message.indexOf('duplicate key') >= 0) {
        return Promise.reject(errors.request('There\'s already a user with that email address (%s)', user.email))
      }
      return Promise.reject(err)
    })
  }

  static find_by_id (id) {
    return database.findOne(`
        SELECT id, first_name, last_name, email, company_name
        FROM auth.users WHERE id=$1
      `, [id])
      .then((user) => {
        // Why are we setting this to 'admin'? Perspective will not really be required on the server side
        // except in middleware.check_admin, but that is used by routes like routes_admin_settings.js and
        // routes_admin_users.js. For today, lets not break anything.
        // Also, note that all the plan ACL has moved to service.
        user.perspective = 'admin'
        return Promise.resolve(user)
      })
  }

  static doesUserNeedMultiFactor(id) {
    return database.findOne('SELECT is_totp_enabled FROM auth.users WHERE id = $1', [id])
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
        database.findOne('SELECT id, email FROM auth.users WHERE lower(email)=$1', [email])
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
        var text = [
          `You're receiving this email because a password reset was requested `,
          `for your user account in the ARO platform.`,
          `\n\nFollow the link below to reset your password.`,
          `\n${base_url}/reset_password?${querystring.stringify({ code: code })}`,
          `\n\nPlease do not reply to this email. It was automatically generated.`,
        ].join('')
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
    var sql = 'UPDATE auth.users SET first_name=$1, last_name=$2, full_name=$3, email=$4 WHERE id=$5'
    return database.findOne(sql, [firstName, lastName, `${firstName} ${lastName}`, email, id])
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
