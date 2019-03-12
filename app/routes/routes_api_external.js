// These are routes for external API access to ARO-Service

var models = require('../models')
const helpers = require('../helpers')
const config = helpers.config
const requestPromise = require('request-promise-native')
const jwt = require('jsonwebtoken')

const EXTERNAL_API_PREFIX = '/v1/api-ext'
const OAUTH_CONNECTION_STRING = `http://${config.OAUTH_CLIENT}:${config.OAUTH_CLIENT_SECRET}@${config.oauth_server_host}`

// A promise that resolves with the public signing key of the OAuth server (which may not be online before this app server)
const authSigningKey = requestPromise({
  method: 'GET',
  uri: `${OAUTH_CONNECTION_STRING}/oauth/token_key`,
  json: true
})
  .then(res => res.value)
  .catch(err => console.error(err))

// A promise that resolves if the user is authenticated correctly, using JWT strategy (will decrypt JWT without calls to the auth server)
const checkUserAuthJWT = (jwtToken) => authSigningKey
    .then(signingKey => {
      return new Promise((resolve, reject) => {
        jwt.verify(jwtToken, signingKey, (err, decoded) => {
          if (err) {
            console.error(err)
            reject({
              statusCode: 400,
              error: 'ERROR: Unable to verify JWT token'
            })
          } else {
            resolve(decoded)
          }
        })
      })
    })
    .catch(err => {
      console.error(err)
      return Promise.reject(err)
    })

// A promise that resolves if the user is authenticated correctly, using token strategy (will call auth server)
const checkUserAuthToken = (token) => requestPromise({
  method: 'POST',
  uri: `${OAUTH_CONNECTION_STRING}/oauth/check_token`,
  qs: {
    token: authTokens[1]
  },
  json: true
})

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  // Expose an unsecured endpoint for API logins.
  api.post(`${EXTERNAL_API_PREFIX}/login`, (request, response, next) => {

    requestPromise({
      method: 'POST',
      uri: `${OAUTH_CONNECTION_STRING}/oauth/token`,
      qs: {
        username: request.body.username,
        password: request.body.password,
        grant_type: 'password'
      },
      json: true
    })
      .then(jsonSuccess(response, next))
      .catch(err => {
        // Error when getting the token. Send it back
        console.error(err.error)
        response.status(err.statusCode).json(err.error)
      })
  })

  // Get all requests (POST/GET/DELETE/PUT,etc) that start with /v1/api-ext, and then pass those
  // on to ARO-Service if the bearer token is authenticated.
  // Do NOT modify any data - this is intended to be a pass-through service
  api.all(`${EXTERNAL_API_PREFIX}/*`, (request, response, next) => {

    // First, get the bearer token from the request
    const authHeader = request.headers.authorization || ''
    const authTokens  = authHeader.split(' ')
    if ((authTokens.length !== 2) || (authTokens[0] !== 'Bearer')) {
      return response.status(401).json('Missing or malformed Bearer token')
    }

    // We have a bearer token, check with our OAuth server to see if it is valid
    checkUserAuthJWT(authTokens[1])   // Replace with checkUserAuthToken if you want to use jdbc tokens
      .then(result => {
        // Success, we can forward the request to service
        var req = {
          url: `${config.aro_service_url}/${request.url}`,
          method: request.method,
          params: request.params,
          json: true
        }

        // Attach request body if required
        if (request.method !== 'GET') {
          req.body = request.body
        }

        models.AROService.request(req)
          .then(jsonSuccess(response, next))
          .catch(next)
      })
      .catch(err => {
        // Error when authenticating the token. Send it back
        console.error(err)
        response.status(err.statusCode).json(err.error)
      })
  })
}