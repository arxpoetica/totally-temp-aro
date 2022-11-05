import NetworkPlan from '../models/network_plan.js'

export const configure = (api, middleware) => {
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
      NetworkPlan.searchAddresses(text, sessionToken, biasLatitude, biasLongitude)
        .then(jsonSuccess(response, next))
        .catch(next)
    }
  })

  // FIXME: legacy code, transfer to service
  // Get addresses for the specified locations from table aro.location_entity
  api.post('/network_plan/targets/addresses', (request, response, next) => {
    var locationIds = request.body.locationIds
    NetworkPlan.getTargetsAddresses(locationIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // FIXME: legacy code, transfer to service
  // Get addresses for the specified service areas
  api.post('/network_plan/service_area/addresses', (request, response, next) => {
    var serviceAreaIds = request.body.serviceAreaIds
    NetworkPlan.getServiceAreaAddresses(serviceAreaIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // FIXME: legacy code, transfer to service
  // Get addresses for the specified analysis areas
  api.post('/network_plan/analysis_area/addresses', (request, response, next) => {
    var analysisAreaIds = request.body.analysisAreaIds
    NetworkPlan.getAnalysisAreaAddresses(analysisAreaIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // FIXME: legacy code, transfer to service
  api.post('/network_plan/getIdsFromSql', (request, response, next)=> {
    let query = request.body.query
    var hasExcludeTerm = false
    var excludeTerms = ['delete','drop','update','alter','insert','call','commit','create']
    excludeTerms.forEach((term) => {
      if(query.toLowerCase().indexOf(term) > -1) hasExcludeTerm = true
    })

    if(!hasExcludeTerm && query.toLowerCase().indexOf("select") > -1 ) {
      NetworkPlan.getIdsFromSql(query)
      .then(jsonSuccess(response, next))
      .catch(next)
    } else {
      response.status(400).json({
        error: 'Query Not Supported'
      })
    }
  });

}
