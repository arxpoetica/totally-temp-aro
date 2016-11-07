var helpers = require('../helpers')
var models = require('../models')
var config = helpers.config
var database = helpers.database

function listTABC (plan_id) {
  var names = ['T', 'A', 'B', 'C']
  return database.query(`
      SELECT name FROM client.plan r
        WHERE plan_type='G' AND r.parent_plan_id IN (
        (SELECT q.id FROM client.plan q WHERE q.parent_plan_id IN (
          (SELECT id FROM client.plan WHERE parent_plan_id = $1)
        ))
      )
    `, [plan_id])
    .then((rows) => rows.map((row) => row.name))
    .then((rows) => {
      var maxIndex = rows.reduce((max, name) => {
        var index = names.indexOf(name)
        return max < index ? index : max
      }, -1)
      rows.push(names[maxIndex + 1])
      return rows
    })
}

exports.configure = (api, middleware) => {
  api.get('/reports/tabc/:plan_id/list', (request, response, next) => {
    var plan_id = request.params.plan_id
    return listTABC(plan_id)
      .then((output) => response.send(output))
      .catch(next)
  })

  api.get('/reports/tabc/:plan_id/:name', (request, response, next) => {
    var name = request.params.name
    var plan_id = request.params.plan_id
    var req = {
      method: 'GET',
      url: config.aro_service_url + `/rest/report-extended/${name}/${plan_id}.csv`
    }
    return models.AROService.request(req)
      .then((output) => response.send(output))
      .catch(next)
  })

  api.get('/reports/tabc/:plan_id/kml/:type', (request, response, next) => {
    var plan_id = request.params.plan_id
    var type = request.params.type
    listTABC(plan_id).then((names) => {
      var index = names.indexOf(type)
      if (index === -1) {
        return next(new Error(`Unknown report type ${type}, or report not available`))
      }
      var planQuery = null
      if (type === names[names.length - 1]) {
        planQuery = `
          p.id IN (
            (SELECT r.id FROM client.plan r
              WHERE plan_type='W' AND r.parent_plan_id IN (
              (SELECT id FROM client.plan WHERE parent_plan_id = $1)
            ))
          )
        `
      } else {
        planQuery = `
          p.id IN (
            (SELECT r.id FROM client.plan r
              WHERE name = '${type}' AND plan_type='G' AND r.parent_plan_id IN (
              (SELECT q.id FROM client.plan q WHERE q.parent_plan_id IN (
                (SELECT id FROM client.plan WHERE parent_plan_id = $1)
              ))
            ))
          )
        `
      }

      return database.findOne('SELECT name FROM client.plan WHERE id=$1', [plan_id])
        .then((plan) => {
          return models.NetworkPlan.exportKml(plan_id, planQuery)
            .then((kml_output) => {
              response.attachment(`TABC ${request.params.type} ${plan.name}.kml`)
              response.send(kml_output)
            })
        })
    })
    .catch(next)
  })
}
