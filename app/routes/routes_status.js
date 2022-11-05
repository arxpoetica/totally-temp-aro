import expressProxy from 'express-http-proxy'
import config from '../helpers/config.cjs'

export const configure = (api, middleware) => {
  api.get('/status', (request, response, next) => {
    response.json({
      env: process.env.NODE_ENV || null,
      client: process.env.ARO_CLIENT
    })
  })

  api.get('/aro-status/*', expressProxy(config.aro_service_url, {
    proxyReqPathResolver: req => req.url,
    timeout: 2000,
    proxyErrorHandler: (err, res, next) => {
      switch (err && err.code) {
        case 'ECONNREFUSED': {
          return res.status(500).send('service connection refused')
        }
        default: {
          return res.status(500).send('Error')
        }
      }
    },
  }))

}
