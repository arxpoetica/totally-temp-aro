// These are routes for external API access to ARO-Service

var models = require('../models')
const helpers = require('../helpers')
const config = helpers.config
const requestPromise = require('request-promise-native')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  const EXTERNAL_API_PREFIX = '/v1/api-ext'
  // Expose an unsecured endpoint for API logins.
  api.post(`${EXTERNAL_API_PREFIX}/login`, (request, response, next) => {

    requestPromise({
      method: 'POST',
      uri: `http://acme:acmesecret@172.18.0.1:8999/oauth/token`,
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
    requestPromise({
      method: 'POST',
      uri: `http://acme:acmesecret@172.18.0.1:8999/oauth/check_token`, //?token=${authTokens[1]}`,
      qs: {
        token: authTokens[1]
      },
      json: true
    })
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