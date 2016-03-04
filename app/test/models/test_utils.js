var models = require('../../models')
var _ = require('underscore')

var app = require('../../app')
var passport_stub = require('passport-stub')
passport_stub.install(app)

var test_user = null

exports.request = require('supertest')(app)
exports.agent = require('supertest').agent(app)

exports.create_test_user = () => {
  if (test_user) return Promise.resolve(test_user)

  var email = 'test@example.com'
  var password = '#test$'
  return models.User.find_by_email(email)
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

exports.create_test_user()
  .then(() => {
    exports.login_app()
    global.run && global.run() // mocha `run()` method
  })
  .catch((err) => console.log('err', err.stack))

exports.login_app = (user) => {
  passport_stub.login(user || test_user)
}

exports.logout_app = () => {
  passport_stub.logout()
}

exports.test_viewport = (obj) => {
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
