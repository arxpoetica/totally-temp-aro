import Location from '../models/location.js'

export const configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  // FIXME: legacy code, transfer to service
  api.get('/locations/:plan_id/:location_id/show', (request, response, next) => {
    var plan_id = request.params.plan_id
    var location_id = request.params.location_id
    Location.showInformation(plan_id, location_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // FIXME: legacy code, transfer to service
  api.post('/locations/exportRegion', (request, response, next)=> {
    let polygon = request.body.polygon
    let planId = request.body.planId
    Location.exportAsCSV(polygon, planId).then((locations)=> {
      response.setHeader('Content-disposition', 'attachment; filename=exported_locations.csv');
      response.set('Content-Type', 'text/csv');
      response.status(200).send(locations);
    })
    .catch(next)
  });

}
