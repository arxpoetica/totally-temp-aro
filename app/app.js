var ejs = require('ejs')
var express = require('express')
var passport = require('passport')
var bodyParser = require('body-parser')
var compression = require('compression')
const Socket = require('./sockets')

var app = module.exports = express()
app.use(compression())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(require('cookie-session')({
  name: 'session',
  keys: ['key1', 'key2']
}))
app.use(require('express-flash')())
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static('public'))
app.set('views', './views')
app.use('/components', express.static('./public/javascripts/lib/components'))
app.engine('html', ejs.renderFile)
if (process.env.NODE_ENV === 'staging') {
  app.set('env', 'production')
}

var middleware = require('./middleware')
require('./routes/routes_authentication').configure(app, middleware)

var api = express.Router()
var routes = [
  'status',
  'api',
  'competitors',
  'user',
  'map',
  'multifactor',
  'wirecenter',
  'county_subdivision',
  'census_block',
  'location',
  'network',
  'boundary',
  'service',
  'tiles',
  'market_size',
  'network_plan',
  'customer_profile',
  'admin_users',
  'admin_settings',
  'settings',
  'financial_profile',
  'reports'
]
routes.forEach((route) => {
  require('./routes/routes_' + route).configure(api, middleware)
})
require('./routes/routes_errors').configure(api, middleware)
require('./routes/routes_errors').configure(app, middleware)
app.use(api)

// Do not start app if ARO_CLIENT is not set
if (!process.env.ARO_CLIENT) {
  console.log('**** Error: The ARO_CLIENT environment variable must be set before starting the application.')
  process.exit(1)
}

if (module.id === require.main.id) {
  var port = process.env.PORT || 8000
  var server = app.listen(port)
  server.timeout = 60 * 60 * 1000 // 30min
  const socket = new Socket(server)
  api.Socket = socket   // For debugging only. Can be removed if not used in routes_service.js
}
