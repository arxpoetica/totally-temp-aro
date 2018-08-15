var helpers = require('../helpers')
var models = require('../models')
var config = helpers.config
var database = helpers.database
var parse = require('csv-parse')
var json2csv = require("json2csv");

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
      
      selected_service_layer AS (
      SELECT *
      FROM inputs i
      JOIN reports.plan_service_layer psl
      ON psl.root_plan_id = i.plan_id
      ),
      
      modified_equipment AS (
      SELECT 
        ne.*
      FROM  inputs i
      JOIN  reports.network_equipment ne
        ON ne.root_plan_id = i.plan_id
        AND ne.is_branch_data
      ),
      
      modified_equipment_service_area AS (
      SELECT
        s.id AS service_area_id,
        s.name as service_area_name,
        s.code as service_area_code,
        me.*
      FROM inputs i
      CROSS JOIN modified_equipment me
      CROSS JOIN selected_service_layer ssl
      JOIN client.service_area s
        ON ST_Contains(s.geom,me.geom) AND s.service_layer_id = ssl.id
      ),
      
      existing_equipment_service_area AS (
      SELECT
        pesa.*
      FROM inputs i
      JOIN reports.plan_equipment_service_area pesa
        ON  pesa.plan_id = i.plan_id
      
      ),

      all_plan_equipment AS (
      SELECT
        COALESCE (be.id, pesa.id) AS id,  
        COALESCE (be.object_id, pesa.object_id) AS object_id,
        COALESCE (be.geom, pesa.geom) AS geom,
        COALESCE (be.node_type_id, pesa.node_type_id) AS node_type_id,
        COALESCE (be.network_equipment, pesa.network_equipment) AS network_equipment,
        COALESCE (be.deployment_type, pesa.deployment_type) AS deployment_type,
        COALESCE (be.is_library_data, pesa.is_library_data) AS is_library_data,
        COALESCE (be.is_branch_data, pesa.is_branch_data) AS is_branch_data,
        COALESCE (be.status, pesa.status) AS status,
        COALESCE (be.site_clli, pesa.site_clli) AS site_clli,
        COALESCE (be.site_name, pesa.site_name) AS site_name,
        COALESCE (be.service_area_name, pesa.service_area_name) AS service_area_name, 
        COALESCE (be.service_area_code, pesa.service_area_code) AS service_area_code 
      FROM  modified_equipment_service_area be
      FULL OUTER JOIN existing_equipment_service_area pesa
        ON  pesa.plan_id = be.root_plan_id
        AND pesa.object_id = be.object_id
      )
      --SELECT * FROM all_plan_equipment ;
      SELECT
      se.status AS "Status",
      nt.description AS "Equipment Type",
      ST_Y(se.geom) AS "Latitude",
      ST_X(se.geom) AS "Longitude",
      se.site_clli AS "Site CLLI",
      se.site_name AS "Site Name",
      se.service_area_name AS "Exchange Name",
      se.service_area_code AS "Exchange CLLI"
      FROM all_plan_equipment se
      JOIN client.network_node_types nt
        ON nt.id = se.node_type_id
        AND nt.name <> 'junction_splitter' 
      ORDER BY nt.description    
    `;

    database.query(planQ).then(function (results) {
      //response.attachment('planSummary.csv')
      response.setHeader('Content-disposition', `attachment; filename=planSummary.csv`);
      response.set('Content-Type', 'text/csv');
      results.length > 0 ? response.send(json2csv({data:results})) : response.send('')
    })

  });

  api.get("/reports/planSummary/:plan_id/:site_boundary" , function (request, response, next) {
    var plan_id = request.params.plan_id
    var site_boundary = request.params.site_boundary
    var planQ = `
    --location summary
    WITH inputs AS (
      SELECT
        p.id AS plan_id,
        bt.id as boundary_type,
        bt.name,
        bt.description
      FROM client.plan p
      CROSS JOIN client.site_boundary_type bt
      WHERE bt.name = '${site_boundary}' AND p.id = ${plan_id} 
      ),
      
      selected_service_layer AS (
      SELECT
           *
      FROM inputs i
      JOIN reports.plan_service_layer psl
      ON psl.root_plan_id = i.plan_id
      ),
      
      modified_boundaries AS (
        SELECT 
          nb.*
        FROM  inputs i
        JOIN  reports.network_boundary nb
          ON nb.root_plan_id = i.plan_id
          AND nb.is_branch_data
          AND nb.boundary_type = i.boundary_type
        AND nb.date_from <> '294276-01-01 00:00:00'::timestamp
      ),
      
      service_areas AS (
        SELECT
          psa.*
        FROM inputs i
        JOIN reports.plan_service_area psa
          ON i.plan_id = psa.tagged_plan_id 
      ),
      
      data_sources AS (
      SELECT *
      FROM inputs i
      JOIN client.active_plan_data_source d ON i.plan_id = d.root_plan_id
        AND data_type_id = 3
      ),
      
      existing_boundaries AS (
        SELECT
          sb.id,
          sb.object_id,
          sb.network_node_object_id
          --STRING_AGG(pbsa.service_area_code, ',') AS code,
          --STRING_AGG(pbsa.service_area_name, ',') AS name
        FROM inputs i
        /*JOIN reports.plan_boundary_service_area pbsa
          ON pbsa.root_plan_id = i.plan_id
          AND pbsa.boundary_type = i.boundary_type */
        CROSS JOIN data_sources ds
        CROSS JOIN service_areas sa 
        JOIN client.extended_boundary sb 
          ON (sb.data_source_id = ANY ( ds.full_path)) --ds.data_source_id OR (sb.data_source_id = ANY (ds.parent_path))) AND sb.is_library_data
          AND sb.date_to = '294276-01-01 00:00:00'
          AND sb.boundary_type = i.boundary_type 
          AND st_intersects(sa.geom, sb.geom)
        GROUP BY 1, 2, 3
      ),
      
      all_boundaries AS (
      SELECT
        *	
      FROM modified_boundaries
      /*    COALESCE(mb.id, xb.id)                                         AS id,
          COALESCE(mb.network_node_object_id, xb.network_node_object_id) AS network_node_object_id,
          COALESCE(mb.object_id, xb.object_id)                           AS object_id
      
        --COALESCE(mb.code, xb.code) AS code,
        --COALESCE(mb.name, xb.name) AS name
        FROM existing_boundaries xb
        FULL OUTER JOIN modified_boundaries mb
          ON mb.object_id = xb.object_id*/
        ),
      
      location_ds_ids as (
        select unnest(ds.parent_path || ds.id) as ds_id,
            g.name AS data_source_name
        from inputs i
        join client.active_plan_data_source ads on
                                            i.plan_id = ads.root_plan_id
                                            and ads.data_type_id = 1
        join aro_core.data_source ds
          on ds.id = ads.data_source_id
          LEFT JOIN aro_core.global_library g ON ds.id = g.data_source_id
      ),
      
      boundary_locations AS (
        SELECT
           l.id AS location_id,
           l.object_id AS location_object_id,
           l.geom AS location_geom,
           l.cb_gid,
           sa.id AS service_area_id,
           l.location_type, 
         l.number_of_households,
         lds.data_source_name,
        l.is_locked,
           b.*
        FROM
          inputs i
          cross join selected_service_layer ssl
          CROSS JOIN modified_boundaries mb
          cross join location_ds_ids lds
        JOIN client.extended_boundary b
           ON b.id = mb.id
          JOIN client.extended_location l
            ON ST_Contains(mb.geom, l.geom)
               AND lds.ds_id = l.data_source_id
        JOIN client.service_area sa
          ON sa.service_layer_id = ssl.id
          AND ST_Contains(sa.geom, l.geom)
             AND ST_Intersects(sa.geom, mb.geom)
      ),
      
      service_area_locations AS (
        SELECT
          l.*,
          sa.id AS service_area_id,
        lds.data_source_name
        FROM inputs i
          cross join location_ds_ids lds
          JOIN reports.plan_service_area sal
            ON sal.tagged_plan_id = i.plan_id
          JOIN client.extended_location l
            on
              lds.ds_id = l.data_source_id
          JOIN client.service_area sa
            on sal.id = sa.id
               AND ST_Contains(sa.geom, l.geom)
      ),
      
      reconciled_locations AS (
      
      SELECT 
        (CASE WHEN bl.id IS NOT NULL THEN 1 ELSE 0 END) + 
          (CASE WHEN sl.id IS NOT NULL THEN 2 ELSE 0 END) AS  reconciled_code,
        COALESCE(bl.service_area_id, sl.service_area_id) AS location_service_area_id,
        COALESCE(bl.id, sl.id) AS id,
        COALESCE(bl.location_id, sl.id) AS location_id,
        COALESCE(bl.location_geom, sl.geom) AS geom,
        COALESCE(bl.location_object_id, sl.object_id) AS location_object_id,
        COALESCE(bl.object_id, sl.object_id) AS boundary_object_id,
        COALESCE(bl.location_type, sl.location_type) AS location_type,
        bl.network_node_object_id AS equipment_object_id,
        COALESCE(bl.cb_gid, sl.cb_gid)::int AS cb_gid,
        COALESCE(bl.service_area_id, sl.service_area_id) AS service_area_id,
        COALESCE(bl.number_of_households, sl.number_of_households) AS number_of_households,
        COALESCE(bl.data_source_name, sl.data_source_name) AS data_source_name,
        COALESCE(bl.is_locked, sl.is_locked) AS is_locked		
      FROM service_area_locations sl
      FULL OUTER JOIN boundary_locations bl
          ON bl.location_object_id = sl.object_id
      
      ),
      
      matched_equipment AS (
        SELECT 
          ne.*
        FROM  inputs i
        CROSS JOIN all_boundaries b
        JOIN  reports.network_equipment ne
            ON ne.root_plan_id = i.plan_id
            AND ne.is_branch_data
               AND ne.object_id = b.network_node_object_id
            AND ne.node_type_id <> 8
        
      ),
      
      unique_gids AS (
      SELECT DISTINCT cb_gid
      FROM reconciled_locations rl
      ),
      
      joiner AS (
      SELECT cb.*
      FROM aro.census_blocks cb
      JOIN unique_gids rl
        ON cb.gid =rl.cb_gid
      )
      
      SELECT 
      rl.location_object_id                                                                                     AS "Location Object ID",
        rl.data_source_name                                                                                             AS "Data Source",
        rl.number_of_households																					AS "Location Count",
        rl.location_type                                                                                          AS "Location Type",
        rl.is_locked AS "Locked",  
        ST_Y(
            rl.geom)                                                                                              AS "Location Latitude",
        ST_X(
            rl.geom)                                                                                              AS "Location Longitude",
        e.site_name                                                                                               AS "Covered-By Site Name",
        e.site_clli                                                                                               AS "Covered-By Site CLLI",
        e.object_id                                                                                               AS "Covered-By Site Object ID",
        sa.name                                                                                                   AS "Wirecenter Name",
        sa.code                                                                                                   AS "Wirecenter CLLI" ,
        cb.tabblock_id                                                                                            AS "Census Block" ,
        (SELECT description
         FROM aro_core.tag
         WHERE id = ((cb.tags -> 'category_map' ->> (SELECT id
                                                     FROM aro_core.category
                                                     WHERE description =
                                                           'CAF Phase I Part I') :: text) :: int))                AS "CAF Phase I Part I Tag",
        (SELECT description
         FROM aro_core.tag
         WHERE id = ((cb.tags -> 'category_map' ->> (SELECT id
                                                     FROM aro_core.category
                                                     WHERE description =
                                                           'CAF Phase I Part II') :: text) :: int))               AS "CAF Phase I Part II Tag",
        (SELECT description
         FROM aro_core.tag
         WHERE id = ((cb.tags -> 'category_map' ->> (SELECT id
                                                     FROM aro_core.category
                                                     WHERE description =
                                                           'CAF Phase II') :: text) :: int))                      AS "CAF Phase II Tag" 
                                
      FROM reconciled_locations rl
      JOIN joiner cb
        ON cb.gid =rl.cb_gid
      JOIN client.service_area sa
        ON sa.id = rl.location_service_area_id
      LEFT JOIN all_boundaries b
        ON rl.boundary_object_id = b.object_id
      LEFT JOIN matched_equipment e
          ON rl.equipment_object_id = e.object_id          
    `;

    return database.findOne('SELECT name FROM client.active_plan WHERE id=$1', [plan_id])
    .then((plan) => {  
      database.query(planQ).then(function (results) {
        response.setHeader('Content-disposition', `attachment; filename=Plan locations-${plan.name}.csv`);
        response.set('Content-Type', 'text/csv');
        results.length > 0 ? response.send(json2csv({data:results})) : response.send('')
      })
    })

  });

  api.get("/reports/planSummary/kml/:plan_id/:site_boundary", function (request, response, next) {
    var plan_id = request.params.plan_id
    var site_boundary = request.params.site_boundary
    return database.findOne('SELECT name FROM client.active_plan WHERE id=$1', [plan_id])
    .then((plan) => {

    var escape = (name) => name.replace(/</g, '&lt;').replace(/>/g, '&gt;')

    var kmlOutput = `<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <Document>
        <name>${escape(`Site boundaries-${site_boundary}-${plan.name}`)}</name>
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
        var planQ = `
        --boundary summary
        WITH inputs AS (
        SELECT
         p.id AS plan_id,
         bt.id as boundary_type,
         bt.name,
         bt.description,
         ARRAY(SELECT jsonb_array_elements_text(p.tag_mapping -> 'linkTags' -> 'serviceAreaIds'))::int[]  AS service_area_ids
        FROM client.plan p
        CROSS JOIN client.site_boundary_type bt
        WHERE bt.name = '${site_boundary}' AND p.id = ${plan_id}
        ),
        
        selected_service_layer AS (
        SELECT
            *
        FROM inputs i
        JOIN reports.plan_service_layer psl
        ON psl.root_plan_id = i.plan_id
        ),
        
        modified_boundaries AS (
         SELECT
           nb.*
         FROM  inputs i
         JOIN  reports.network_boundary nb
           ON nb.root_plan_id = i.plan_id
           AND nb.is_branch_data
           AND nb.boundary_type = i.boundary_type
            AND nb.date_from <> '294276-01-01 00:00:00'::timestamp
        ),
        
        existing_boundaries AS (
         SELECT
           pbsa.id,
           pbsa.object_id,
           STRING_AGG(pbsa.service_area_code, ',') AS code,
           STRING_AGG(pbsa.service_area_name, ',') AS name
         FROM inputs i
         JOIN reports.plan_boundary_service_area pbsa
           ON pbsa.root_plan_id = i.plan_id
           AND pbsa.boundary_type = i.boundary_type
           AND pbsa.service_area_id = ANY(i.service_area_ids)
         GROUP BY 1, 2
        ),
        
        all_boundaries AS (
         SELECT *
         FROM modified_boundaries
         /*SELECT
           COALESCE(mb.id, xb.id) AS id,
           COALESCE(mb.object_id, xb.object_id) AS object_id,
            mb.network_node_object_id AS network_node_object_id
           FROM existing_boundaries xb
           FULL OUTER JOIN modified_boundaries mb
             ON mb.object_id = xb.object_id
         */
        ),
        
        matched_equipment AS (
         SELECT
           ne.*
         FROM  inputs i
         CROSS JOIN all_boundaries b
         JOIN  reports.network_equipment ne
             ON ne.root_plan_id = i.plan_id
             AND ne.is_branch_data
             AND ne.object_id = b.network_node_object_id
             AND ne.node_type_id <> 8
         
        ),
        
        all_boundary_info AS (
        SELECT
         xb.geom,
         xb.id,
         xb.object_id,
         xb.network_node_object_id AS equipment_object_id,
         String_Agg(sa.name, ',') AS service_area_name,
         String_Agg(sa.code, ',') AS service_area_code
        FROM selected_service_layer sl
        CROSS JOIN all_boundaries b
        JOIN client.extended_boundary xb
         ON xb.id = b.id
        JOIN client.service_area sa  
         ON sa.service_layer_id = sl.id
         AND ST_Intersects(sa.geom, xb.geom)
        GROUP BY 1, 2, 3,4
        )
        
        SELECT
         ST_AsKML(b.geom) AS site_boundary_geom,
         ST_AsKML(e.geom) AS node_location,
         COALESCE(e.site_clli, '') AS "Site CLLI Code"
        --  ,e.site_name AS "Site Name"
        --  i.description AS "Boundary Type"
        FROM inputs i
        CROSS JOIN all_boundary_info b
        LEFT JOIN matched_equipment e
          ON e.object_id = b.equipment_object_id 
          WHERE e.geom  IS NOT NULL;
        `
        return database.query(planQ)
      })
      .then((siteBoundaries) => {
        //kmlOutput += `<Folder>`
        siteBoundaries.forEach((siteBoundary) => {
          kmlOutput += `
          <Placemark>
            <name>${escape(siteBoundary['Site CLLI Code'])}</name>
            <styleUrl>#shapeColor</styleUrl>${siteBoundary.site_boundary_geom}
          </Placemark>\n`
          //For Label
          kmlOutput += `
          <Placemark>
            <name>${escape(siteBoundary['Site CLLI Code'])}</name>
            ${siteBoundary.node_location}
          </Placemark>\n`
        })
        //kmlOutput += '</Folder>'
        kmlOutput += '</Document></kml>'
        return kmlOutput
      })
    })
    .then((output) => response.send(output))
    .catch(next)
  });

}
