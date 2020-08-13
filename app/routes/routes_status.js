exports.configure = (api, middleware) => {
  api.get('/status', (request, response, next) => {
    response.json({
      env: process.env.NODE_ENV || null,
      client: process.env.ARO_CLIENT
    })
  })
}
