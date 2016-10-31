var helpers = require('../helpers')
var models = require('../models')
var config = helpers.config

exports.configure = (api, middleware) => {
  api.get('/reports/tabc/:plan_id/summary', (request, response, next) => {
    var plan_id = request.params.plan_id
    var req = {
      method: 'GET',
      url: config.aro_service_url + `/rest/report-extended/tabc/${plan_id}.csv`
    }
    models.AROService.request(req)
      .then((output) => {
        response.attachment('tabc.csv')
        response.send(output)
      })
      .catch(next)
  })

  api.get('/reports/tabc/:plan_id/kml/:type', (request, response, next) => {
    var plan_id = request.params.plan_id
    var file_name = 'foo'
    var types = ['T', 'A', 'B', 'C']
    var type = request.params.type
    if (types.indexOf(type) === -1) {
      return next(new Error(`Unknown report type ${type}`))
    }
    if (type === 'C') {
      type = ['T', 'A', 'B'].map((t) => `'${t}'`).join(', ')
      type = `IN (${type})`
    } else {
      type = `= '${type}'`
    }

    var planQuery = `
      IN (
        (SELECT p.id FROM client.plan p WHERE p.parent_plan_id IN (
          (SELECT r.id FROM client.plan r WHERE r.parent_plan_id IN (
            SELECT id FROM client.plan
            WHERE parent_plan_id=$1
            AND name ${type}
          ))
        ))
      )
    `
    models.NetworkPlan.exportKml(plan_id, planQuery)
      .then((kml_output) => {
        response.attachment(file_name + '.kml')
        response.send(kml_output)
      })
      .catch(next)
  })
}
