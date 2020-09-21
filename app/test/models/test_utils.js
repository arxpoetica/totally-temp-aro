var models = require('../../models')
var _ = require('underscore')

var app = require('../../app')
var passportStub = require('passport-stub')
passportStub.install(app)

var test_user = null

exports.request = require('supertest')(app)
exports.agent = require('supertest').agent(app)

exports.createTestUser = () => {
  if (test_user) return Promise.resolve(test_user)

  var email = 'test@example.com'
  var password = '#test$'
  return models.User.findByEmail(email)
    .then((user) => {
      return user || models.User.register({
        first_name: 'test',
        last_name: 'test',
        email: email,
        password: password
      })
    })
    .then((user) => {
      exports.test_user = test_user = user
      return user
    })
}

exports.createTestUser()
  .then(() => {
    exports.loginApp()
    global.run && global.run() // mocha `run()` method
  })
  .catch((err) => console.log('err', err.stack))

exports.loginApp = (user) => {
  passportStub.login(user || test_user)
}

exports.logoutApp = () => {
  passportStub.logout()
}

exports.testViewport = (obj) => {
  return _.extend(obj || {}, {
    nelat: '40.805607996143685',
    nelon: '-73.91296976252443',
    swlat: '40.69962581648302',
    swlon: '-74.06883829279786',
    zoom: '16',
    threshold: '10'
  })
}

exports.swich_db = (dbname) => {
  process.env.DATABASE_URL = 'postgres://aro:aro@localhost/' + dbname
  // TODO: config?
}
