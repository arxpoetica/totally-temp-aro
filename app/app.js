const ejs = require('ejs')
const express = require('express')
const { initServerSockets } = require('./sockets/server-sockets')
const passport = require('passport')
const bodyParser = require('body-parser')
const compression = require('compression')
const morgan = require('morgan')

async function kickoff() {

  const app = express()
  const port = process.env.PORT || 8000
  const server = app.listen(port)
  server.timeout = 60 * 60 * 1000 // 30min

  const ServerSocketManager = await initServerSockets(server)

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

  const middleware = require('./middleware')
  require('./routes/routes_authentication').configure(app, middleware)
  require('./routes/routes_api_external').configure(app, middleware)  // Has its own authorization scheme

  const api = express.Router()

  require('./routes/routes_status').configure(api, middleware)
  require('./routes/routes_api').configure(api, middleware)
  require('./routes/routes_competitors').configure(api, middleware)
  require('./routes/routes_user').configure(api, middleware)
  require('./routes/routes_map').configure(api, middleware)
  require('./routes/routes_multifactor').configure(api, middleware)
  require('./routes/routes_wirecenter').configure(api, middleware)
  require('./routes/routes_county_subdivision').configure(api, middleware)
  require('./routes/routes_census_block').configure(api, middleware)
  require('./routes/routes_location').configure(api, middleware)
  require('./routes/routes_network').configure(api, middleware)
  require('./routes/routes_boundary').configure(api, middleware)
  require('./routes/routes_etl_template').configure(api, middleware)
  // TODO: don't use ServerSocketManager in route endpoints...remove...
  require('./routes/routes_service').configure(api, middleware, ServerSocketManager)
  require('./routes/routes_market_size').configure(api, middleware)
  require('./routes/routes_network_plan').configure(api, middleware)
  require('./routes/routes_admin_users').configure(api, middleware)
  require('./routes/routes_admin_settings').configure(api, middleware)
  require('./routes/routes_settings').configure(api, middleware)
  require('./routes/routes_reports').configure(api, middleware)
  require('./routes/routes_ui_assets').configure(api, middleware)
  // TODO: don't use ServerSocketManager in route endpoints...remove...
  require('./routes/routes_socket').configure(api, middleware, ServerSocketManager)
  require('./routes/routes_ui_settings').configure(api, middleware)

  require('./routes/routes_errors').configure(api, middleware)
  require('./routes/routes_errors').configure(app, middleware)
  app.use(api)

}
kickoff()

// Do not start app if ARO_CLIENT is not set
if (!process.env.ARO_CLIENT) {
  console.log('**** Error: The ARO_CLIENT environment variable must be set before starting the application.')
  process.exit(1)
}
