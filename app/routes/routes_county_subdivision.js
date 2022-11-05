import CountySubdivision from '../models/county_subdivision.js'

export const configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/county_subdivisions/:statefp', middleware.viewport, (request, response, next) => {
    var statefp = request.params.statefp
    var viewport = request.viewport
    CountySubdivision.findByStatefp(statefp, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
