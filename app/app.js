var ejs = require('ejs')
var express = require('express')
var passport = require('passport')
var bodyParser = require('body-parser')
var compression = require('compression')
const morgan = require('morgan')

var app = module.exports = express()
morgan.token('body', req => JSON.stringify(req.body))
const loggerFunction = (tokens, req, res) => {
  if (req.url === '/login' || req.url === '/oauth/token') {
    // Do not log post body for login requests, or else the users password will get logged
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'), '-',
      tokens['response-time'](req, res), 'ms'
    ].join(' ')
  } else {
    // Same as "dev" but with the :body added to it
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'), '-',
      tokens['response-time'](req, res), 'ms',
      tokens.body(req, res)
    ].join(' ')
  }
}

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  res.set('Pragma', 'no-cache');
  next()
})

app.use(compression())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ limit: '1000mb' }))

// Print requests out twice - once when we receive them, once when it completes.
app.use(morgan((tokens, req, res) => 'ARO-PRE-REQUEST ' + loggerFunction(tokens, req, res), { immediate: true }))
// skip logging for all vector tile calls
app.use(morgan(loggerFunction, { skip: ({ url }) => url.includes('.mvt?') }))

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
require('./routes/routes_api_external').configure(app, middleware)  // Has its own authorization scheme

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
  'etl_template',
  'service',
  'market_size',
  'network_plan',
  'admin_users',
  'admin_settings',
  'settings',
  'reports',
  'ui_assets',
  'socket',
  'ui_settings'
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
  require('./sockets/socketManager').initialize(server)
}
