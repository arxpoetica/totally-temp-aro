var models = require('../models')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  // FIXME: legacy code, transfer to service
  api.get('/search/addresses', (request, response, next) => {
    const sessionToken = request.query.sessionToken
    if (!sessionToken) {
      Promise.reject('ERROR: You must specify a session token when performing an address search')
        .catch(next)
    } else {
      const text = request.query.text
      const biasLatitude = request.query.biasLatitude   // Optional
      const biasLongitude = request.query.biasLongitude // Optional
      models.NetworkPlan.searchAddresses(text, sessionToken, biasLatitude, biasLongitude)
        .then(jsonSuccess(response, next))
        .catch(next)
    }
  })

  // FIXME: legacy code, transfer to service
  // Get addresses for the specified locations from table aro.location_entity
  api.post('/network_plan/targets/addresses', (request, response, next) => {
    var locationIds = request.body.locationIds
    models.NetworkPlan.getTargetsAddresses(locationIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // FIXME: legacy code, transfer to service
  // Get addresses for the specified service areas
  api.post('/network_plan/service_area/addresses', (request, response, next) => {
    var serviceAreaIds = request.body.serviceAreaIds
    models.NetworkPlan.getServiceAreaAddresses(serviceAreaIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // FIXME: legacy code, transfer to service
  // Get addresses for the specified analysis areas
  api.post('/network_plan/analysis_area/addresses', (request, response, next) => {
    var analysisAreaIds = request.body.analysisAreaIds
    models.NetworkPlan.getAnalysisAreaAddresses(analysisAreaIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

}
