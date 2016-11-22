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
  api.get('/reports/user_defined/:plan_id/kml', (request, response, next) => {
    var plan_id = request.params.plan_id
    return database.query(`
        SELECT ST_ASKML(sa.geom) AS geom
        FROM client.selected_service_area ssa
        JOIN client.service_area sa ON ssa.service_area_id = sa.id
        WHERE ssa.plan_id = $1
      `, [plan_id])
      .then((rows) => {
        var kmlOutput = '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'
        var escape = (name) => name.replace(/</g, '&lt;').replace(/>/g, '&gt;')

        return Promise.resolve()
          .then(() => (
            database.findOne('SELECT name FROM client.plan WHERE id=$1', [plan_id])
          ))
          .then((plan) => {
            kmlOutput += `<name>${escape(plan.name)}</name>
              <Style id="shapeColor">
               <LineStyle>
                 <color>ff0000ff</color>
                 <width>4</width>
               </LineStyle>
              </Style>
            `
            rows.forEach((row) => {
              kmlOutput += `<Placemark><styleUrl>#shapeColor</styleUrl>${row.geom}</Placemark>\n`
            })
            kmlOutput += '</Document></kml>'
            return kmlOutput
          })
      })
      .then((output) => response.send(output))
      .catch(next)
  })

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
      if (names.indexOf(type) === -1) {
        return next(new Error(`Unknown report type ${type}, or report not available`))
      }
      var planQuery = null
      if (type === names[names.length - 1]) {
        // plan_type='W' AND
        planQuery = `
          p.id IN (
            (SELECT r.id FROM client.plan r
              WHERE r.parent_plan_id IN (
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
            .then((kmlOutput) => {
              response.attachment(`TABC ${request.params.type} ${plan.name}.kml`)
              response.send(kmlOutput)
            })
        })
    })
    .catch(next)
  })
}
