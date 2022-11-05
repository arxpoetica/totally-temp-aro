import CensusBlock from '../models/census_block.js'

export const configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  // FIXME: legacy code, transfer to service
  api.get('/census_blocks/:id/details', (request, response, next) => {
    var id = request.params.id
    CensusBlock.getCensusBlockDetails(id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

}
