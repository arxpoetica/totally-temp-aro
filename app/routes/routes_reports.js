var helpers = require('../helpers')
var models = require('../models')
var config = helpers.config
var database = helpers.database

exports.configure = (api, middleware) => {

  // FIXME: legacy code, transfer to service
  api.get('/report-extended/:name/:plan_id/:type', (request, response, next) => {
    var name = request.params.name
    var plan_id = request.params.plan_id
    var type = request.params.type
    var req = {
      method: 'GET',
      url: config.aro_service_url + `/report-extended/${name}/${plan_id}.${type}`
    }
    return models.AROService.request(req)
      .then((output) => response.send(output))
      .catch(next)
  })

  // FIXME: legacy code, transfer to service
  api.get("/reports/releaseNotes/versions", function (request, response, next) {
    database.findOne('select array_agg(version) as versions from client.release_notes').then((result) => {
      response.send(result)
    })
  });

  // FIXME: legacy code, transfer to service
  api.get("/reports/releaseNotes", function (request, response, next) {
    var notes = `select id,version,name from client.release_notes order by id desc`;
    database.query(notes).then((result) => {
      response.send(result)
    })
  });

  // FIXME: legacy code, transfer to service
  api.get("/reports/releaseNotes/:id", function (request, response, next) {
    var version_id = request.params.id
    database.findOne('select id,version,description from client.release_notes where id =$1', [version_id])
      .then((result) => {
        response.send(result)
      })
  });

}
