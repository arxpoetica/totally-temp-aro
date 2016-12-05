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
    return database.findOne('SELECT name FROM client.plan WHERE id=$1', [plan_id])
      .then((plan) => {
        var escape = (name) => name.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        var kmlOutput = `<kml xmlns="http://www.opengis.net/kml/2.2">
          <Document>
            <name>${escape(plan.name)}</name>
              <Style id="shapeColor">
               <LineStyle>
                 <color>ff0000ff</color>
                 <width>4</width>
               </LineStyle>
               <PolyStyle>
                 <fill>0</fill>
                 <outline>1</outline>
               </PolyStyle>
              </Style>
        `

        return Promise.resolve()
          .then(() => {
            return database.query(`
              SELECT ST_AsKML(sa.geom) AS geom, n.attributes -> 'name' AS name
              FROM client.plan rp
              JOIN client.plan mp ON rp.id = mp.parent_plan_id
              JOIN client.plan wp ON mp.id = wp.parent_plan_id
              JOIN client.plan hp ON wp.wirecenter_id = hp.wirecenter_id AND hp.plan_type = 'H'
              JOIN client.network_nodes n ON hp.id = n.plan_id
              JOIN client.service_area sa ON wp.wirecenter_id = sa.id
              WHERE rp.id = $1
                AND n.node_type_id = 1
            `, [plan_id])
          })
          .then((polygons) => {
            kmlOutput += '<Folder><name>Polygons</name>'
            polygons.forEach((polygon) => {
              kmlOutput += `<Placemark><name>${escape(polygon.name || 'NULL')}</name><styleUrl>#shapeColor</styleUrl>${polygon.geom}</Placemark>\n`
            })
            kmlOutput += '</Folder>'
            return database.query(`
              SELECT ST_AsKML(n.geom) AS geom, n.attributes -> 'name' AS name
              FROM client.plan rp
              JOIN client.plan mp ON rp.id = mp.parent_plan_id
              JOIN client.plan wp ON mp.id = wp.parent_plan_id
              JOIN client.plan hp ON wp.wirecenter_id = hp.wirecenter_id AND hp.plan_type = 'H'
              JOIN client.network_nodes n ON hp.id = n.plan_id
              WHERE rp.id = $1
                AND n.node_type_id = 1
            `, [plan_id])
          })
          .then((hubs) => {
            kmlOutput += '<Folder><name>Hubs</name>'
            hubs.forEach((hub) => {
              kmlOutput += `<Placemark><name>${escape(hub.name || 'NULL')}</name><styleUrl>#shapeColor</styleUrl>${hub.geom}</Placemark>\n`
            })
            kmlOutput += '</Folder>'
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

  api.get('/reports/fiber_zone_summary/:plan_id', (request, response, next) => {
    var plan_id = request.params.plan_id
    var req = {
      method: 'GET',
      url: config.aro_service_url + `/rest/report-extended/fiber_zone_summary/${plan_id}.csv`
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
