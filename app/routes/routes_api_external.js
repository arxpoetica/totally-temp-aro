// These are routes for external API access to ARO-Service

const helpers = require('../helpers')
const config = helpers.config
const database = helpers.database
const expressProxy = require('express-http-proxy')
const requestPromise = require('request-promise-native')
const jwt = require('jsonwebtoken')
const userIdInjector = require('./user-id-injector')
const { createLogger, LOGGER_GROUPS } = require('../helpers/logger')
const logger = createLogger(LOGGER_GROUPS.ROUTES)

const OAUTH_CONNECTION_STRING = `http://${config.oauth_server_host}`

// A promise that resolves with the public signing key of the OAuth server (which may not be online before this app server)
const delayPromise = new Promise((resolve, reject) => setTimeout(() => resolve(), 60000))
const authSigningKey = delayPromise
  .then(() => requestPromise({
    method: 'GET',
    uri: `${OAUTH_CONNECTION_STRING}/oauth/token_key`,
    json: true
  }))
  .then(res => res.value)
  .catch(err => {
    logger.error('********************** Error when getting token key from OAuth server')
    logger.error('If you don\'t have a OAuth server setup, then you can ignore this error')
    logger.error(err.error)
  })

// A promise that resolves if the user is authenticated correctly, using JWT strategy (will decrypt JWT without calls to the auth server)
const checkUserAuthJWT = (jwtToken) => authSigningKey
  .then(signingKey => {
    return new Promise((resolve, reject) => {
      jwt.verify(jwtToken, signingKey, (err, decoded) => {
        if (err) {
          logger.error(err)
          reject({
            statusCode: 400,
            error: {
              short: 'ERROR: Unable to verify JWT token',
              long: JSON.stringify(err)
            }
          })
        } else {
          resolve(decoded)
        }
      })
    })
  })
  .catch(err => {
    logger.error(err)
    return Promise.reject(err)
  })

// Middleware to check the validity of a bearer token
const bearerTokenCheckMiddleware = (req, res, next) => {
  {
    // First, get the bearer token from the request
    const authHeader = req.headers.authorization || ''
    const authTokens  = authHeader.split(' ')
    if ((authTokens.length !== 2) || (authTokens[0] !== 'Bearer')) {
      return res.status(401).json('Missing or malformed Bearer token')
    }

    // We have a bearer token, check with our OAuth server to see if it is valid
    checkUserAuthJWT(authTokens[1]) // Replace with checkUserAuthToken if you want to use jdbc tokens
      .then(result => database.findOne('SELECT id FROM auth.users WHERE email=$1', [result.user_name]))
      .then(user => {
        if (!user || !user.id) {
          return Promise.reject({ statusCode: 401, error: 'User ID not found in users table' })
        }
        req.userIdFromJWT = user.id
        next() // Success, we can forward the request to service. The forwarding will be handled by the next middleware in the chain.
      })
      .catch(err => {
        // Error when authenticating the token. Send it back
        logger.error(err)
        res.status(err.statusCode).json(err.error)
      })
  }
}

exports.configure = (api, middleware) => {
  // Expose an unsecured endpoint for API logins.
  api.post(`/oauth/*`, expressProxy(OAUTH_CONNECTION_STRING))

  // Get all requests (POST/GET/DELETE/PUT,etc) that start with /v1/api-ext, and then pass those
  // on to ARO-Service if the bearer token is authenticated.
  // Do NOT modify any data - this is intended to be a pass-through service
  const EXTERNAL_API_PREFIX = '/api-ext'
  api.all(`${EXTERNAL_API_PREFIX}/*`, bearerTokenCheckMiddleware, expressProxy(`${config.aro_service_url}`, {
    proxyReqPathResolver: req => userIdInjector(req, EXTERNAL_API_PREFIX, EXTERNAL_API_PREFIX, req.userIdFromJWT)
  }))
}
