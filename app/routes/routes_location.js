var models = require('../models')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  // FIXME: legacy code, transfer to service
  api.get('/locations/:plan_id/:location_id/show', (request, response, next) => {
    var plan_id = request.params.plan_id
    var location_id = request.params.location_id
    models.Location.showInformation(plan_id, location_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // FIXME: legacy code, transfer to service
  api.post('/locations/exportRegion', (request, response, next)=> {
    let polygon = request.body.polygon
    let planId = request.body.planId
    models.Location.exportAsCSV(polygon, planId).then((locations)=> {
      response.setHeader('Content-disposition', 'attachment; filename=exported_locations.csv');
      response.set('Content-Type', 'text/csv');
      response.status(200).send(locations);
    })
    .catch(next)
  });

  // FIXME: legacy code, transfer to service
  api.post('/locations/getLocationIds', (request, response, next)=> {
    let query = request.body.query
    var hasExcludeTerm = false
    var excludeTerms = ['delete','drop','update','alter','insert','call','commit','create']
    excludeTerms.forEach((term) => {
      if(query.toLowerCase().indexOf(term) > -1) hasExcludeTerm = true
    })

    if(!hasExcludeTerm && query.toLowerCase().indexOf("select") > -1 ) {
      models.Location.getLocationIds(query)
      .then(jsonSuccess(response, next))
      .catch(next)
    } else {
      response.status(400).json({
        error: 'Query Not Supported'
      })
    }
  });
}
