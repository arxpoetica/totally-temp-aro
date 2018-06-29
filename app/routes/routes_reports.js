var helpers = require('../helpers')
var models = require('../models')
var config = helpers.config
var database = helpers.database
var parse = require('csv-parse')

function listTABC (plan_id) {
  var names = ['T', 'A', 'B', 'C']
  return database.query(`
      SELECT name FROM client.active_plan r
        WHERE plan_type='G' AND r.parent_plan_id IN (
        (SELECT q.id FROM client.active_plan q WHERE q.parent_plan_id IN (
          (SELECT id FROM client.active_plan WHERE parent_plan_id = $1)
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
    return database.findOne('SELECT name FROM client.active_plan WHERE id=$1', [plan_id])
      .then((plan) => {
        var escape = (name) => name.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        var kmlOutput = `<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
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
              SELECT ST_AsKML(sa.geom) AS geom, n.attributes -> 'hub_name' AS name
              FROM client.active_plan rp
              JOIN client.active_plan mp ON rp.id = mp.parent_plan_id
              JOIN client.active_plan wp ON mp.id = wp.parent_plan_id
              JOIN client.active_plan hp ON wp.wirecenter_id = hp.wirecenter_id AND hp.plan_type = 'H'
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
              SELECT ST_AsKML(n.geom) AS geom, n.attributes -> 'hub_name' AS name
              FROM client.active_plan rp
              JOIN client.active_plan mp ON rp.id = mp.parent_plan_id
              JOIN client.active_plan wp ON mp.id = wp.parent_plan_id
              JOIN client.active_plan hp ON wp.wirecenter_id = hp.wirecenter_id AND hp.plan_type = 'H'
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
      url: config.aro_service_url + `/report-extended/${name}/${plan_id}.csv`
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
            (SELECT r.id FROM client.active_plan r
              WHERE r.parent_plan_id IN (
              (SELECT id FROM client.active_plan WHERE parent_plan_id = $1)
            ))
          )
        `
      } else {
        planQuery = `
          p.id IN (
            (SELECT r.id FROM client.active_plan r
              WHERE name = '${type}' AND plan_type='G' AND r.parent_plan_id IN (
              (SELECT q.id FROM client.active_plan q WHERE q.parent_plan_id IN (
                (SELECT id FROM client.active_plan WHERE parent_plan_id = $1)
              ))
            ))
          )
        `
      }

      return database.findOne('SELECT name FROM client.active_plan WHERE id=$1', [plan_id])
        .then((plan) => {
          return models.NetworkPlan.exportKml(plan_id, planQuery)
            .then((kmlOutput) => response.send(kmlOutput))
        })
    })
    .catch(next)
  })

  api.get("/reports/:plan_id/network/csv/nodes" , function (request, response, next) {
    var plan_id = request.params.plan_id
    var planQ = `SELECT
                  nn. ID,
                  NAME,
                  description,
                  st_x (geom) AS lat,
                  st_y (geom) AS long
              FROM
                  client.network_nodes nn
              JOIN client.network_node_types nt ON nt. ID = nn.node_type_id
              WHERE
                  nn.plan_id IN (
                      (
                          SELECT r. ID FROM client.active_plan r WHERE r.parent_plan_id IN ((SELECT ID FROM client.active_plan WHERE parent_plan_id = ${plan_id}))
                      )
                  )`;


       database.query(planQ).then(function (neq) {
         var json2csv = require("json2csv");
         var result = json2csv({data:neq });
          response.send(result)
       })

  });

  api.get('/reports/network_analysis/:plan_id/:name', (request, response, next) => {
    var name = request.params.name
    var plan_id = request.params.plan_id
    var req = {
      method: 'GET',
      url: config.aro_service_url + `/v1/report-extended/${name}/${plan_id}.csv`
    }
    return models.AROService.request(req)
      .then((output) => {
        parse(output,function(err, jsonoutput){
          response.send(jsonoutput)
        })
      })
      .catch(next)
  })

  api.get('/reports/network_analysis/download/:plan_id/:name', (request, response, next) => {
    var name = request.params.name
    var plan_id = request.params.plan_id
    var req = {
      method: 'GET',
      url: config.aro_service_url + `/v1/report-extended/${name}/${plan_id}.csv`
    }
    return models.AROService.request(req)
      .then((output) => {
        response.attachment('NetworkAnalysis.csv')
        response.send(output)
      })
      .catch(next)
  })

  api.get("/reports/planSummary/:plan_id" , function (request, response, next) {
    var plan_id = request.params.plan_id
    var planQ = `
      --equipment summary
      WITH inputs AS (
      SELECT ${plan_id} AS plan_id
      ),
      
      existing_config AS (
      SELECT config_id
      FROM client.plan p
      JOIN inputs i ON p.id = i.plan_id AND is_deleted = FALSE
      ),
      
      existing_data_source AS (
      SELECT data_type_id, data_source_id
      FROM existing_config p
      JOIN aro_core.type_definition t ON t.data_config_id = p.config_id
      ),
      
      plan_config AS (
      SELECT p.config_id AS config_id
      FROM inputs i
      JOIN client.plan p ON p.parent_plan_id = i.plan_id AND is_deleted = FALSE
      ),
      
      plan_data_source AS (
      SELECT data_type_id, data_source_id
      FROM plan_config p
      JOIN aro_core.type_definition t ON t.data_config_id = p.config_id
      ),
      
      plan_service_areas AS (
      SELECT sas.value::text::int AS id
      FROM   client.plan p, jsonb_array_elements(p.tag_mapping->'linkTags'->'serviceAreaIds') sas, inputs i
      WHERE p.id = i.plan_id
      ),
      
      existing_equipment AS (
      SELECT DISTINCT ON (object_id) n.id, n.node_type_id, n.object_id
      FROM client.service_area s
      JOIN plan_service_areas p ON s.id = p.id
      JOIN client.network_nodes n ON ST_Contains(s.geom,n.geom)
      JOIN existing_data_source d ON n.data_source_id = d.data_source_id
      ORDER BY object_id
      ),
      
      planned_equipment AS (
      SELECT DISTINCT ON (object_id) v.id, v.data_source_id, node_type_id, attributes, object_id
      -- FROM client.dh_versioned_network_node v
      FROM client.versioned_network_node v
      JOIN plan_data_source p ON v.data_source_id = p.data_source_id AND is_branch_data = TRUE
      ORDER BY object_id, version_number DESC
      -- ORDER BY object_id DESC
      ),
      
      existing_planned_equipment AS (
      SELECT COALESCE(e.id, p.id) AS node_id, COALESCE(e.object_id, p.object_id) AS object_id, COALESCE(e.node_type_id, p.node_type_id) AS node_type_id, CASE WHEN e.id IS NULL THEN 'planned'::text ELSE 'existing'::text END AS type
      FROM existing_equipment e
      FULL OUTER JOIN planned_equipment p ON e.id = p.id
      )      
      
      SELECT
      p.type AS Status,
      n.description AS Equipment_Type,
      ST_Y(nn.geom) AS Latitude,
      ST_X(nn.geom) AS Longitude,
      network_equipment->'siteInfo'->'siteClli' AS Site_CLLI,
      network_equipment->'siteInfo'->'siteName' AS Site_Name
      FROM existing_planned_equipment p
      JOIN client.network_node_types n ON p.node_type_id = n.id
      JOIN client.network_nodes nn ON p.node_id = nn.id
      WHERE n.description <> 'Junction Splitter'
      ORDER BY p.type
      
    `;

       database.query(planQ).then(function (results) {
         var json2csv = require("json2csv");
         //var header = ['Status','Equipment Type','Latitude','Longitude','Site CLLI','Site Name']
         response.attachment('planSummary.csv')
         response.send(json2csv({data:results}))
       })

  });

}
