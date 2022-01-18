const helpers = require('../helpers')
const cache = helpers.cache
const public_config = helpers.public_config
const uuidv4 = require('uuid/v4')

const googleMapsLicensing = {
  API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  CLIENT_ID: process.env.GOOGLE_MAPS_CLIENT_ID,
  CHANNEL: process.env.GOOGLE_MAPS_CHANNEL
}

exports.configure = (api, middleware) => {
  api.get('/', (request, response, next) => {
    response.render('index.html', {
      env: process.env.NODE_ENV,
      config: public_config,
      serviceLayers: cache.serviceLayers,
      analysisLayers: cache.analysisLayers,
      googleMapsLicensing: googleMapsLicensing,
      mapType: process.env.ARO_CLIENT === 'frontier' ? 'SATELLITE' : 'ROADMAP',
      analyticsTrackingKey: process.env.ANALYTICS_TRACKING_KEY,
      ARO_CLIENT_DONOT_USE_IN_CODE: process.env.ARO_CLIENT,
      GOOGLE_MAPS_GESTURE_HANDLING: process.env.GOOGLE_MAPS_GESTURE_HANDLING || 'auto',
      reportPage: request.query.reportPage ? JSON.parse(request.query.reportPage) : undefined,
      reportOverview: request.query.reportOverview ? JSON.parse(request.query.reportOverview) : undefined,
      // TODO: this is a stop gap until the following ticket is implemented:
      // https://www.pivotaltracker.com/story/show/180829331
      ARO_GLOBALS: JSON.stringify({
        MABL_TESTING: process.env.MABL_TESTING,
      }),
    })
  })

  api.get('/configuration', (request, response, next) => {
    response.status(200).json({
      user: request.user,
      appConfiguration: cache.configuration,
      enumStrings: cache.enumStrings,
      // For google maps licensing, specify one of the following:
      // 1. Nothing (no API_KEY, no CLIENT_ID, no CHANNEL)
      // 2. API_KEY only
      // 3. CLIENT_ID only
      // 4. CHANNEL and CLIENT_ID only
      googleMapsLicensing: googleMapsLicensing
    })
  })
}
