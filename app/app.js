import ejs from 'ejs'
import express from 'express'
import { initServerSockets } from './sockets/server-sockets.js'
import passport from 'passport'
import bodyParser from 'body-parser'
import compression from 'compression'
import morgan from 'morgan'
import cookieSession from 'cookie-session'
import expressFlash from 'express-flash'

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

  app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
  }))
  app.use(expressFlash())
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(express.static('public'))
  app.set('views', './views')
  app.use('/components', express.static('./public/javascripts/lib/components'))
  app.engine('html', ejs.renderFile)
  if (process.env.NODE_ENV === 'staging') {
    app.set('env', 'production')
  }

  const api = express.Router()

  // need to put semi-colons on these lines; otherwise it's a function of the prior line
  const middleware = (await import ('./middleware.js')).default;
  (await import('./routes/routes_authentication.js')).configure(app, middleware);
  (await import('./routes/routes_api_external.js')).configure(app, middleware);  // Has its own authorization scheme

  (await import('./routes/routes_status.js')).configure(api, middleware);
  (await import('./routes/routes_api.js')).configure(api, middleware);
  (await import('./routes/routes_competitors.js')).configure(api, middleware);
  (await import('./routes/routes_map.js')).configure(api, middleware);
  (await import('./routes/routes_multifactor.js')).configure(api, middleware);
  (await import('./routes/routes_wirecenter.js')).configure(api, middleware);
  (await import('./routes/routes_county_subdivision.js')).configure(api, middleware);
  (await import('./routes/routes_census_block.js')).configure(api, middleware);
  (await import('./routes/routes_location.js')).configure(api, middleware);
  (await import('./routes/routes_etl_template.js')).configure(api, middleware);
  // TODO: don't use ServerSocketManager in route endpoints...remove...
  (await import('./routes/routes_service.js')).configure(api, middleware, ServerSocketManager);
  (await import('./routes/routes_network_plan.js')).configure(api, middleware);
  (await import('./routes/routes_admin_users.js')).configure(api, middleware);
  (await import('./routes/routes_admin_settings.js')).configure(api, middleware);
  (await import('./routes/routes_settings.js')).configure(api, middleware);
  (await import('./routes/routes_reports.js')).configure(api, middleware);
  (await import('./routes/routes_ui_assets.js')).configure(api, middleware);
  (await import('./routes/routes_ui_settings.js')).configure(api, middleware);
  (await import('./routes/routes_errors.js')).configure(api, middleware);

  (await import('./routes/routes_errors.js')).configure(app, middleware);
  app.use(api)

}
kickoff()

// Do not start app if ARO_CLIENT is not set
if (!process.env.ARO_CLIENT) {
  console.log('**** Error: The ARO_CLIENT environment variable must be set before starting the application.')
  process.exit(1)
}
