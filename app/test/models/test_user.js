/* global describe it before after */
var chai = require('chai')
var expect = require('chai').expect
var models = require('../../models')
var test_utils = require('./test_utils')
var request = test_utils.agent

chai.use(require('chai-string'))

describe('User', () => {
  before(() => test_utils.logoutApp())
  after(() => test_utils.loginApp())

  describe('#register() and #login()', () => {
    var email = 'user_' +
      require('crypto').randomBytes(16).toString('hex') +
      '@Example.com'

    var user = {
      first_name: 'Alberto',
      last_name: 'Gimeno',
      email: email,
      password: 'foobar1234'
    }

    it('should register a user', () => {
      models.User.latest_code = null
      return models.User.register(user)
        .then((usr) => {
          expect(usr).to.be.an('object')
          expect(usr.id).to.be.a('number')
          expect(usr.first_name).to.be.equal(user.first_name)
          expect(usr.last_name).to.be.equal(user.last_name)
          expect(usr.email).to.be.equal(user.email.toLowerCase())
          expect(usr.password).to.not.be.ok
          expect(models.User.latest_code).to.not.be.ok
          // var id = usr.id
        })
    })

    it('should fail to log in the user with a wrong password', (done) => {
      request
        .post('/login')
        .type('form')
        .send({ email: user.email, password: user.password + 'x' })
        .end((err, res) => {
          if (err) return done(err)
          expect(res.statusCode).to.be.equal(302)
          expect(res.headers.location).to.be.equal('/login')

          request
            .get(res.headers.location)
            .end((err, res) => {
              if (err) return done(err)
              expect(res.statusCode).to.be.equal(200)
              expect(res.text).to.contain('Invalid password')
              done()
            })
        })
    })

    it('should fail to log in the user with a wrong email', (done) => {
      var email = 'x' + user.email
      request
        .post('/login')
        .accept('application/json')
        .type('form')
        .send({ email: email, password: user.password })
        .end((err, res) => {
          if (err) return done(err)
          expect(res.statusCode).to.be.equal(302)
          expect(res.headers.location).to.be.equal('/login')

          request
            .get(res.headers.location)
            .end((err, res) => {
              if (err) return done(err)
              expect(res.statusCode).to.be.equal(200)
              expect(res.text).to.contain('No user found with that email (' + email + ')')
              done()
            })
        })
    })

    it('should log in the user', () => {
      return models.User.login(user.email, user.password)
        .then((usr) => {
          expect(usr).to.be.an('object')
          expect(usr.id).to.be.a('number')
          expect(usr.first_name).to.be.equal(user.first_name)
          expect(usr.last_name).to.be.equal(user.last_name)
          expect(usr.email).to.be.equal(user.email.toLowerCase())
          expect(usr.password).to.not.be.ok
        })
    })

    it('should log in the user through http', (done) => {
      request
        .post('/login')
        .accept('application/json')
        .type('form')
        .send({ email: user.email, password: user.password })
        .end((err, res) => {
          if (err) return done(err)
          expect(res.statusCode).to.be.equal(302)
          expect(res.headers.location).to.be.equal('/')
          done()
        })
    })

    it('should log in the user with email in different case', () => {
      return models.User.login(user.email.toUpperCase(), user.password)
        .then((usr) => {
          expect(usr).to.be.an('object')
          expect(usr.id).to.be.a('number')
          expect(usr.first_name).to.be.equal(user.first_name)
          expect(usr.last_name).to.be.equal(user.last_name)
          expect(usr.email).to.be.equal(user.email.toLowerCase())
          expect(usr.password).to.not.be.ok
        })
    })

    it('should log in the user through http', (done) => {
      request
        .post('/login')
        .type('form')
        .send({ email: user.email.toUpperCase(), password: user.password })
        .end((err, res) => {
          if (err) return done(err)
          expect(res.statusCode).to.be.equal(302)
          expect(res.headers.location).to.be.equal('/')
          done()
        })
    })

    it('should find users by text', (done) => {
      request
        .get('/user/find')
        .accept('application/json')
        .query({ text: 'Gi' })
        .end((err, res) => {
          if (err) return done(err)
          var users = res.body
          expect(res.statusCode).to.be.equal(200)
          expect(users).to.be.an('array')
          expect(users).to.have.length.above(0)
          var usr = users[0]
          expect(usr).to.be.an('object')
          expect(usr.id).to.be.a('number')
          expect(usr.first_name).to.be.a('string')
          expect(usr.last_name).to.be.a('string')
          expect(usr.email).to.be.a('string')
          expect(usr.password).to.not.be.ok
          done()
        })
    })

    it('should log out the user', (done) => {
      request
        .get('/logout')
        .end((err, res) => {
          if (err) return done(err)
          expect(res.statusCode).to.be.equal(302)
          expect(res.headers.location).to.be.equal('/login')

          request
            .get('/')
            .end((err, res) => {
              if (err) return done(err)
              expect(res.statusCode).to.be.equal(302)
              expect(res.headers.location).to.be.equal('/login')
              done()
            })
        })
    })

    it('should prevent to register a user with the same email address', () => {
      user.email = user.email.toLowerCase()
      models.User.register(user)
        .then(() => Promise.reject('This should not be executed'))
        .catch((err) => {
          expect(err).to.be.ok
          expect(err.message).to.contain('already')
        })
    })
  })

  describe('password resets', () => {
    var email = 'user_' +
      require('crypto').randomBytes(16).toString('hex') +
      '@Example.com'

    var user = {
      first_name: 'Alberto',
      last_name: 'Gimeno',
      email: email
    }

    var id

    it('should register a user with no password', () => {
      delete user.password

      return models.User.register(user)
        .then((usr) => {
          expect(usr).to.be.an('object')
          expect(usr.id).to.be.a('number')
          expect(usr.first_name).to.be.equal(user.first_name)
          expect(usr.last_name).to.be.equal(user.last_name)
          expect(usr.email).to.be.equal(user.email.toLowerCase())
          expect(usr.password).to.not.be.ok
          expect(models.User.latest_code).to.be.ok
          id = usr.id
        })
    })

    it('should fail to log a user with no password', (done) => {
      request
        .post('/login')
        .type('form')
        .send({ email: user.email, password: 'asdfa' })
        .end((err, res) => {
          if (err) return done(err)
          expect(res.statusCode).to.be.equal(302)
          expect(res.headers.location).to.be.equal('/login')

          request
            .get('/login')
            .end((err, res) => {
              if (err) return done(err)
              expect(res.statusCode).to.be.equal(200)
              expect(res.text).to.contain('Invalid password')
              done()
            })
        })
    })

    it('should go to the password reset page', (done) => {
      request
        .get('/forgot_password')
        .end((err, res) => {
          if (err) return done(err)
          expect(res.statusCode).to.be.equal(200)
          done()
        })
    })

    it('should fail to request a password reset if the email does not exist', (done) => {
      models.User.latest_code = null
      request
        .post('/forgot_password')
        .type('form')
        .send({ email: 'x-' + user.email })
        .end((err, res) => {
          if (err) return done(err)
          expect(res.statusCode).to.be.equal(302)
          expect(res.headers.location).to.be.equal('/forgot_password')
          expect(models.User.latest_code).not.to.be.ok

          request
            .get(res.headers.location)
            .end((err, res) => {
              if (err) return done(err)
              expect(res.statusCode).to.be.equal(200)
              expect(res.text).to.contain('No user found with email')
              done()
            })
        })
    })

    it('should request a password reset', (done) => {
      models.User.latest_code = null
      request
        .post('/forgot_password')
        .type('form')
        .send({ email: user.email })
        .end((err, res) => {
          if (err) return done(err)
          expect(res.statusCode).to.be.equal(302)
          expect(res.headers.location).to.be.equal('/login')
          expect(models.User.latest_code).to.be.ok
          done()
        })
    })

    it('should load the reset the password page', (done) => {
      request
        .get('/reset_password')
        .end((err, res) => {
          if (err) return done(err)
          expect(res.statusCode).to.be.equal(200)
          done()
        })
    })

    it('should fail to reset the password if the passwords do not match', (done) => {
      user.password = 'new_password'
      request
        .post('/reset_password')
        .type('form')
        .send({ code: models.User.latest_code, password: user.password, repassword: 'x-' + user.password })
        .end((err, res) => {
          if (err) return done(err)
          expect(res.statusCode).to.be.equal(302)
          expect(res.headers.location).to.startsWith('/reset_password')

          request
            .get(res.headers.location)
            .end((err, res) => {
              if (err) return done(err)
              expect(res.statusCode).to.be.equal(200)
              expect(res.text).to.contain('Passwords do not match')
              done()
            })
        })
    })

    it('should fail to reset the password if the code is wrong', (done) => {
      user.password = 'new_password'
      request
        .post('/reset_password')
        .type('form')
        .send({ code: 'x-' + models.User.latest_code, password: user.password, repassword: user.password })
        .end((err, res) => {
          if (err) return done(err)
          expect(res.statusCode).to.be.equal(302)
          expect(res.headers.location).to.startsWith('/reset_password')

          request
            .get(res.headers.location)
            .end((err, res) => {
              if (err) return done(err)
              expect(res.statusCode).to.be.equal(200)
              expect(res.text).to.contain('Reset code not found or expired')
              done()
            })
        })
    })

    it('should reset the password', (done) => {
      user.password = 'new_password'
      request
        .post('/reset_password')
        .type('form')
        .send({ code: models.User.latest_code, password: user.password, repassword: user.password })
        .end((err, res) => {
          if (err) return done(err)
          expect(res.statusCode).to.be.equal(302)
          expect(res.headers.location).to.be.equal('/login')
          done()
        })
    })

    it('should log in with the new password', () => {
      return models.User.login(user.email, user.password)
        .then((usr) => {
          expect(usr).to.be.an('object')
          expect(usr.id).to.be.a('number')
          expect(usr.first_name).to.be.equal(user.first_name)
          expect(usr.last_name).to.be.equal(user.last_name)
          expect(usr.email).to.be.equal(user.email.toLowerCase())
          expect(usr.password).to.not.be.ok
        })
    })

    it('should change the password knowing the previous one', () => {
      var old_password = user.password
      user.password = 'yet_another_password'

      return models.User.changePassword(id, old_password, user.password)
        .then(() => models.User.login(user.email, user.password))
        .then((usr) => {
          expect(usr).to.be.an('object')
          expect(usr.id).to.be.a('number')
          expect(usr.first_name).to.be.equal(user.first_name)
          expect(usr.last_name).to.be.equal(user.last_name)
          expect(usr.email).to.be.equal(user.email.toLowerCase())
          expect(usr.password).to.not.be.ok
        })
    })
  })
})
