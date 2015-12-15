// Network plan
//
// The Route Optimizer finds shortest paths between sources and targets

var helpers = require('../helpers');
var config = helpers.config;
var database = helpers.database;
var validate = helpers.validate;
var multiline = require('multiline');
var txain = require('txain');
var Location = require('./location');
var fs = require('fs');
var RouteOptimizer = require('./route_optimizer');
var Permission = require('./permission');
var CustomerProfile = require('./customer_profile');
var _ = require('underscore');

var NetworkPlan = {};

NetworkPlan.find_edges = function(plan_id, callback) {
  var sql = multiline(function() {;/*
    SELECT edge.id, edge.edge_length, ST_AsGeoJSON(edge.geom)::json AS geom
    FROM custom.route_edges
    JOIN client_schema.graph edge
      ON edge.id = route_edges.edge_id
    WHERE route_edges.route_id=$1
  */});
  database.query(sql, [plan_id], callback);
};

NetworkPlan.find_source_ids = function(plan_id, callback) {
  var sql = multiline(function() {;/*
    SELECT network_node_id::integer AS id
    FROM custom.route_sources
    WHERE route_id=$1
  */});
  database.findValues(sql, [plan_id], 'id', callback);
};

NetworkPlan.find_target_ids = function(plan_id, callback) {
  var sql = multiline(function() {;/*
    SELECT location_id::integer AS id
    FROM custom.route_targets
    WHERE route_id=$1
  */});
  database.findValues(sql, [plan_id], 'id', callback);
};

NetworkPlan.find_plan = function(plan_id, metadata_only, callback) {
  if (arguments.length === 2) {
    callback = metadata_only;
    metadata_only = false;
  }

  var cost_per_meter = 200;
  var output = {
    'feature_collection': {
      'type':'FeatureCollection',
    },
    'metadata': { costs: [] },
  };
  var fiber_cost;

  txain(function(callback) {
    if (!config.route_planning) return callback();

    txain(function(callback) {
      NetworkPlan.find_edges(plan_id, callback);
    })
    .then(function(edges, callback) {
      output.feature_collection.features = edges.map(function(edge) {
        return {
          'type':'Feature',
          'geometry': edge.geom,
        }
      });

      fiber_cost = RouteOptimizer.calculate_fiber_cost(edges, cost_per_meter);
      output.metadata.costs.push({
        name: 'Fiber cost',
        value: fiber_cost,
      });
      RouteOptimizer.calculate_locations_cost(plan_id, callback);
    })
    .then(function(locations_cost, callback) {
      output.metadata.costs.push({
        name: 'Locations cost',
        value: locations_cost,
      });

      if (metadata_only) return callback();
      NetworkPlan.find_target_ids(plan_id, callback);
    })
    .then(function(targets, callback) {
      output.metadata.targets = targets;

      if (metadata_only) return callback();
      NetworkPlan.find_source_ids(plan_id, callback);
    })
    .then(function(sources, callback) {
      output.metadata.sources = sources;
      callback();
    })
    .end(callback);
  })
  .then(function(callback) {
    if (config.route_planning) {
      CustomerProfile.customer_profile_for_route(plan_id, output.metadata, callback);
    } else {
      CustomerProfile.customer_profile_for_existing_fiber(plan_id, output.metadata, callback);
    }
  })
  .then(function(callback) {
    if (!config.route_planning) return callback(null, output);

    txain(function(callback) {
      RouteOptimizer.calculate_revenue_and_npv(plan_id, fiber_cost, callback);
    })
    .then(function(calculation, callback) {
      output.metadata.revenue = calculation.revenue;
      output.metadata.npv = calculation.npv;

      RouteOptimizer.calculate_equipment_nodes_cost(plan_id, callback);
    })
    .then(function(equipment_nodes_cost, callback) {
      output.metadata.costs.push({
        name: 'Equipment nodes cost',
        value: equipment_nodes_cost.total,
        itemized: equipment_nodes_cost.equipment_node_types,
      });

      var up_front_costs = equipment_nodes_cost.total + fiber_cost;
      RouteOptimizer.calculate_revenue_and_npv(plan_id, fiber_cost, callback);
    })
    .then(function(calculation, callback) {
      output.metadata.revenue = calculation.revenue;
      output.metadata.npv = calculation.npv;

      output.metadata.total_cost = output.metadata.costs.reduce(function(total, cost) {
        return total+cost.value;
      }, 0);

      output.metadata.profit = output.metadata.revenue - output.metadata.total_cost;

      if (metadata_only) delete output.feature_collection;

      callback(null, output);
    })
    .end(callback);
  })
  .end(callback);
}

NetworkPlan.recalculate_route = function(plan_id, callback) {
  txain(function(callback) {
    var sql = 'DELETE FROM custom.route_edges WHERE route_id=$1';
    database.execute(sql, [plan_id], callback);
  })
  .then(function(callback) {
    var sql = 'UPDATE custom.route SET updated_at=NOW() WHERE id=$1';
    database.execute(sql, [plan_id], callback);
  })
  .then(function(callback) {
    var sql = multiline(function() {;/*
      (SELECT id, 1 FROM custom.route_sources WHERE route_id=$1 limit 1)
      UNION
      (SELECT id, 2 FROM custom.route_targets WHERE route_id=$1 limit 1)
    */});
    database.query(sql, [plan_id], callback);
  })
  .then(function(rows, callback) {
    // the route needs at least one source and at least one target
    if (rows.length < 2) return callback();

    var sql = multiline(function() {;/*
      WITH edges AS (
        SELECT DISTINCT edge_id FROM
          (SELECT id as edge_id
              FROM
                pgr_kdijkstraPath('SELECT id, source::integer, target::integer, edge_length::double precision AS cost FROM client_schema.graph',
                  (select vertex_id from custom.route_sources where route_id=$1 limit 1)::integer,
                  array(select vertex_id from custom.route_targets where route_id=$1)::integer[],
                  false, false) AS dk
              JOIN client_schema.graph edge
                ON edge.id = dk.id3) as edge_id
      )
      INSERT INTO custom.route_edges (edge_id, route_id) (SELECT edge_id, $1 as route_id FROM edges);
    */});
    database.execute(sql, [plan_id], callback);
  })
  .end(callback);
};

NetworkPlan.recalculate_and_find_route = function(plan_id, callback) {
  txain(function(callback) {
    NetworkPlan.recalculate_route(plan_id, callback);
  })
  .then(function(callback) {
    NetworkPlan.find_plan(plan_id, callback);
  })
  .end(callback);
};

NetworkPlan.find_all = function(user, text, callback) {
  if (arguments.length === 1) {
    callback = user;
    user = null;
  }
  var sql = multiline(function() {;/*
    SELECT
      $1::text AS carrier_name,
      route.id, name, area_name, ST_AsGeoJSON(area_centroid)::json as area_centroid, ST_AsGeoJSON(area_bounds)::json as area_bounds,
      users.id as owner_id, users.first_name as owner_first_name, users.last_name as owner_last_name,
      created_at, updated_at
    FROM
      custom.route
    LEFT JOIN auth.permissions ON permissions.route_id = route.id AND permissions.rol = 'owner'
    LEFT JOIN auth.users ON users.id = permissions.user_id
  */});
  var params = [config.client_carrier_name];
  if (user) {
    sql += ' WHERE route.id IN (SELECT route_id FROM auth.permissions WHERE user_id=$2)';
    params.push(user.id);
  }
  if (text) {
    text = '%'+text+'%'
    sql += ' AND lower(name) LIKE lower($3)';
    params.push(text);
  }
  sql += '\n LIMIT 20';
  database.query(sql, params, callback);
};

NetworkPlan.create_plan = function(name, area, user, callback) {
  if (arguments.length === 3) {
    callback = user;
    user = null;
  }

  var id;

  validate(function(expect) {
    expect(area, 'area', 'object');
    expect(area, 'area.centroid', 'object');
    expect(area, 'area.centroid.lat', 'number');
    expect(area, 'area.centroid.lng', 'number');
    expect(area, 'area.bounds', 'object');
    expect(area, 'area.bounds.northeast', 'object');
    expect(area, 'area.bounds.northeast.lat', 'number');
    expect(area, 'area.bounds.northeast.lng', 'number');
    expect(area, 'area.bounds.southwest', 'object');
    expect(area, 'area.bounds.southwest.lat', 'number');
    expect(area, 'area.bounds.southwest.lng', 'number');
  }, function() {
    txain(function(callback) {
      var sql = multiline(function(){;/*
        INSERT INTO custom.route (name, area_name, area_centroid, area_bounds, created_at, updated_at)
        VALUES ($1, $2, ST_GeomFromText($3, 4326), ST_Envelope(ST_GeomFromText($4, 4326)), NOW(), NOW()) RETURNING id;
      */});
      var params = [
        name,
        area.name,
        'POINT('+area.centroid.lng+' '+area.centroid.lat+')',
        'LINESTRING('+area.bounds.northeast.lng+' '+area.bounds.northeast.lat+', '+area.bounds.southwest.lng+' '+area.bounds.southwest.lat+')',
      ];
      database.findOne(sql, params, callback);
    })
    .then(function(row, callback) {
      id = row.id;
      if (!user) return callback();
      Permission.grant_access(id, user.id, 'owner', callback);
    })
    .then(function(callback) {
      var sql = multiline(function() {;/*
        SELECT
          $2::text AS carrier_name,
          route.id, name, area_name, ST_AsGeoJSON(area_centroid)::json as area_centroid, ST_AsGeoJSON(area_bounds)::json as area_bounds,
          users.id as owner_id, users.first_name as owner_first_name, users.last_name as owner_last_name,
          created_at, updated_at
        FROM
          custom.route
        LEFT JOIN auth.permissions ON permissions.route_id = route.id AND permissions.rol = 'owner'
        LEFT JOIN auth.users ON users.id = permissions.user_id
        WHERE route.id=$1
      */});
      database.findOne(sql, [id, config.client_carrier_name], callback);
    })
    .end(callback);
  }, callback);
};

NetworkPlan.delete_plan = function(plan_id, callback) {
  var sql = multiline(function() {;/*
    DELETE FROM custom.route WHERE id=$1;
  */});
  database.execute(sql, [plan_id], callback);
};

NetworkPlan.clear_route = function(plan_id, callback) {
  txain(function(callback) {
    var sql = multiline(function() {;/*
      DELETE FROM custom.route_targets WHERE route_id=$1;
    */});
    database.execute(sql, [plan_id], callback);
  })
  .then(function(callback) {
    var sql = multiline(function() {;/*
      DELETE FROM custom.route_sources WHERE route_id=$1;
    */});
    database.execute(sql, [plan_id], callback);
  })
  .then(function(callback) {
    var sql = multiline(function() {;/*
      DELETE FROM custom.route_edges WHERE route_id=$1;
    */});
    database.execute(sql, [plan_id], callback);
  })
  .then(function(callback) {
    var sql = multiline(function() {;/*
      DELETE FROM client_schema.network_nodes WHERE route_id=$1;
    */});
    database.execute(sql, [plan_id], callback);
  })
  .end(callback);
};

NetworkPlan.save_plan = function(plan_id, data, callback) {
  var fields = [];
  var params = [];
  var allowed_fields = ['name'];
  _.intersection(_.keys(data), allowed_fields).forEach(function(key) {
    params.push(data[key]);
    fields.push(key+'=$'+params.length);
  });
  if (fields.length === 0) return callback();

  params.push(plan_id);
  var sql = 'UPDATE custom.route SET '+fields.join(', ')+', updated_at=NOW() WHERE id=$'+params.length;
  database.execute(sql, params, callback);
};

NetworkPlan.edit_route = function(plan_id, changes, callback) {
  txain(function(callback) {
    add_sources(plan_id, changes.insertions && changes.insertions.network_nodes, callback);
  })
  .then(function(callback) {
    add_targets(plan_id, changes.insertions && changes.insertions.locations, callback);
  })
  .then(function(callback) {
    delete_sources(plan_id, changes.deletions && changes.deletions.network_nodes, callback);
  })
  .then(function(callback) {
    delete_targets(plan_id, changes.deletions && changes.deletions.locations, callback);
  })
  .then(function() {
    NetworkPlan.recalculate_and_find_route(plan_id, callback);
  })
  .end(callback);
};

NetworkPlan.export_kml = function(plan_id, callback) {
  var kml_output = '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'

  function escape(name) {
    return name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  txain(function(callback) {
    var sql = 'SELECT name FROM custom.route WHERE id=$1'
    database.findOne(sql, [plan_id], callback)
  })
  .then(function(route, callback) {
    kml_output += '<name>'+escape(route.name)+'</name>'
    kml_output += multiline(function() {;/*
      <Style id="routeColor">
       <LineStyle>
         <color>ff0000ff</color>
         <width>4</width>
       </LineStyle>
      </Style>
      <Style id="targetColor">
       <IconStyle>
         <color>ffffff00</color>
         <scale>1</scale>
         <Icon>
           <href>http://maps.google.com/mapfiles/kml/pushpin/wht-pushpin.png</href>
         </Icon>
       </IconStyle>
      </Style>
      <Style id="sourceColor">
       <IconStyle>
         <color>ffff00ffff</color>
         <scale>1</scale>
         <Icon>
           <href>http://maps.google.com/mapfiles/kml/pushpin/wht-pushpin.png</href>
         </Icon>
       </IconStyle>
      </Style>
    */});

    var sql = multiline(function() {;/*
      SELECT ST_AsKML(edge.geom) AS geom
      FROM custom.route_edges
      JOIN client_schema.graph edge
      ON edge.id = route_edges.edge_id
      WHERE route_edges.route_id = $1
    */});
    database.query(sql, [plan_id], callback)
  })
  .then(function(edges, callback) {
    edges.forEach(function(edge) {
      kml_output += '<Placemark><styleUrl>#routeColor</styleUrl>';
      kml_output += edge.geom;
      kml_output += '</Placemark>\n';
    });

    var sql = multiline(function() {;/*
      SELECT ST_AsKML(locations.geom) AS geom
      FROM custom.route_targets
      JOIN locations
      ON route_targets.location_id = locations.id
      WHERE route_targets.route_id=$1
    */});
    database.query(sql, [plan_id], callback)
  })
  .then(function(targets, callback) {
    targets.forEach(function(target) {
      kml_output += '<Placemark><styleUrl>#targetColor</styleUrl>';
      kml_output += target.geom;
      kml_output += '</Placemark>\n';
    });

    var sql = multiline(function() {;/*
      SELECT ST_AsKML(network_nodes.geom) AS geom
      FROM custom.route_sources
      JOIN client_schema.network_nodes
      ON route_sources.network_node_id = network_nodes.id
      WHERE route_sources.route_id=$1
    */});
    database.query(sql, [plan_id], callback)
  })
  .then(function(sources, callback) {
    sources.forEach(function(source) {
      kml_output += '<Placemark><styleUrl>#sourceColor</styleUrl>';
      kml_output += source.geom;
      kml_output += '</Placemark>\n';
    });

    kml_output += '</Document></kml>';
    callback(null, kml_output);
  })
  .end(callback);
};

function add_sources(plan_id, network_node_ids, callback) {
  if (!_.isArray(network_node_ids) || network_node_ids.length === 0) return callback();

  txain(function(callback) {
    // avoid duplicates
    var sql = multiline(function() {;/*
      DELETE FROM custom.route_sources
      WHERE route_id=$1 AND network_node_id IN ($2)
    */});
    database.execute(sql, [plan_id, network_node_ids], callback);
  })
  .then(function(callback) {
    // calculate closest vertex
    var sql = multiline(function() {;/*
      INSERT INTO custom.route_sources (vertex_id, network_node_id, route_id)
      (SELECT
        vertex.id AS vertex_id, network_nodes.id, $2
      FROM
        client_schema.graph_vertices_pgr AS vertex
      JOIN client_schema.network_nodes network_nodes
        ON network_nodes.geom && vertex.the_geom
      WHERE
        network_nodes.id IN ($1))
    */});
    database.execute(sql, [network_node_ids, plan_id], callback);
  })
  .end(callback);
};

function add_targets(plan_id, location_ids, callback) {
  if (!_.isArray(location_ids) || location_ids.length === 0) return callback();

  txain(function(callback) {
    // avoid duplicates
    var sql = multiline(function() {;/*
      DELETE FROM custom.route_targets
      WHERE route_id=$1 AND location_id IN ($2)
    */});
    database.execute(sql, [plan_id, location_ids], callback);
  })
  .then(function(callback) {
    // calculate closest vertex
    var sql = multiline(function() {;/*
      INSERT INTO custom.route_targets (vertex_id, location_id, route_id)
      (SELECT
        vertex.id AS vertex_id, locations.id, $2 AS route_id
      FROM
        client_schema.graph_vertices_pgr AS vertex
      JOIN aro.locations locations
        ON locations.geom && vertex.the_geom
      WHERE
       st_contains(locations.geom, vertex.the_geom) and locations.id IN ($1))
    */});
    database.execute(sql, [location_ids, plan_id], callback);
  })
  .end(callback);
};

function delete_sources(plan_id, network_node_ids, callback) {
  if (!_.isArray(network_node_ids) || network_node_ids.length === 0) return callback();

  txain(network_node_ids)
  .each(function(network_node_id, callback) {
    var sql = multiline(function() {;/*
      DELETE FROM custom.route_sources
      WHERE route_id=$1 AND network_node_id=$2
    */});
    database.execute(sql, [plan_id, network_node_id], callback);
  })
  .then(function() {
    NetworkPlan.recalculate_and_find_route(plan_id, callback);
  })
  .end(callback);
};

function delete_targets(plan_id, location_ids, callback) {
  if (!_.isArray(location_ids) || location_ids.length === 0) return callback();

  txain(location_ids)
  .each(function(location_id, callback) {
    var sql = multiline(function() {;/*
      DELETE FROM custom.route_targets
      WHERE route_id=$1 AND location_id=$2
    */});
    database.execute(sql, [plan_id, location_id], callback);
  })
  .end(callback);
};

NetworkPlan.calculate_area_data = function(plan_id, callback) {
  var data = {};

  txain(function(callback) {
    var sql = multiline(function() {;/*
      SELECT statefp, countyfp, MIN(ST_distance(geom, (SELECT area_centroid FROM custom.route WHERE id=$1) )) AS distance
      FROM aro.cousub
      GROUP BY statefp, countyfp
      ORDER BY distance
      LIMIT 1
    */});
    database.findOne(sql, [plan_id], callback);
  })
  .then(function(row, callback) {
    data.statefp = row.statefp;
    data.countyfp = row.countyfp;

    callback(null, data);
  })
  .end(callback);
};

module.exports = NetworkPlan;
