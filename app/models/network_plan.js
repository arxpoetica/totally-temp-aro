// Network plan
//
// The Route Optimizer finds shortest paths between sources and targets

var helpers = require('../helpers');
var database = helpers.database;
var validate = helpers.validate;
var multiline = require('multiline');
var txain = require('txain');
var Location = require('./location');
var fs = require('fs');
var RouteOptimizer = require('./route_optimizer');
var _ = require('underscore');

var NetworkPlan = {};

NetworkPlan.find_edges = function(route_id, callback) {
  var sql = multiline(function() {;/*
    SELECT edge.id, edge.edge_length, ST_AsGeoJSON(edge.geom)::json AS geom
    FROM custom.route_edges
    JOIN client.graph edge
      ON edge.id = route_edges.edge_id
    WHERE route_edges.route_id=$1
  */});
  database.query(sql, [route_id], callback);
};

NetworkPlan.find_source_ids = function(route_id, callback) {
  var sql = multiline(function() {;/*
    SELECT network_node_id::integer AS id
    FROM custom.route_sources
    WHERE route_id=$1
  */});
  database.findValues(sql, [route_id], 'id', callback);
};

NetworkPlan.find_target_ids = function(route_id, callback) {
  var sql = multiline(function() {;/*
    SELECT location_id::integer AS id
    FROM custom.route_targets
    WHERE route_id=$1
  */});
  database.findValues(sql, [route_id], 'id', callback);
};

NetworkPlan.find_customer_types = function(route_id, callback) {
  var sql = multiline(function(){;/*
    SELECT ct.name, SUM(households)::integer as households, SUM(businesses)::integer as businesses FROM (
      (SELECT
        hct.customer_type_id AS id, COUNT(*)::integer AS households, 0 as businesses
      FROM
        custom.route_targets t
      JOIN
        households h
      ON
        h.location_id=t.location_id
      JOIN
        client.household_customer_types hct
      ON
        hct.household_id = h.id
      WHERE
        route_id=$1
      GROUP BY hct.customer_type_id)

      UNION

      (SELECT
        bct.customer_type_id as id, 0 as households, COUNT(*)::integer as businesses
      FROM
        custom.route_targets t
      JOIN
        businesses b
      ON
        b.location_id=t.location_id
      JOIN
        client.business_customer_types bct
      ON
        bct.business_id = b.id
      WHERE
        route_id=$1
      GROUP BY bct.customer_type_id)
      ) t
    JOIN
      client.customer_types ct
    ON
      ct.id=t.id
    GROUP BY
      ct.name
    ORDER BY
      ct.name
  */});
  database.query(sql, [route_id], callback);
};

NetworkPlan.find_route = function(route_id, metadata_only, callback) {
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
    NetworkPlan.find_edges(route_id, callback);
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
    RouteOptimizer.calculate_locations_cost(route_id, callback);
  })
  .then(function(locations_cost, callback) {
    output.metadata.costs.push({
      name: 'Locations cost',
      value: locations_cost,
    });

    if (metadata_only) return callback();
    NetworkPlan.find_target_ids(route_id, callback);
  })
  .then(function(targets, callback) {
    output.metadata.targets = targets;

    if (metadata_only) return callback();
    NetworkPlan.find_source_ids(route_id, callback);
  })
  .then(function(sources, callback) {
    output.metadata.sources = sources;

    NetworkPlan.find_customer_types(route_id, callback);
  })
  .then(function(customer_types, callback) {
    output.metadata.customer_types = customer_types;

    output.metadata.customers_businesses_total = customer_types.reduce(function(total, customer_type) {
      return total + customer_type.businesses;
    }, 0);
    output.metadata.customers_households_total = customer_types.reduce(function(total, customer_type) {
      return total + customer_type.households;
    }, 0);

    RouteOptimizer.calculate_revenue_and_npv(route_id, fiber_cost, callback);
  })
  .then(function(calculation, callback) {
    output.metadata.revenue = calculation.revenue;
    output.metadata.npv = calculation.npv;

    RouteOptimizer.calculate_equipment_nodes_cost(route_id, callback);
  })
  .then(function(equipment_nodes_cost, callback) {
    output.metadata.costs.push({
      name: 'Equipment nodes cost',
      value: equipment_nodes_cost.total,
      itemized: equipment_nodes_cost.equipment_node_types,
    });

    output.metadata.total_cost = output.metadata.costs.reduce(function(total, cost) {
      return total+cost.value;
    }, 0);

    output.metadata.total_customers = output.metadata.customer_types.reduce(function(total, type) {
      return total + type.businesses + type.households;
    }, 0);

    if (metadata_only) delete output.feature_collection;

    callback(null, output);
  })
  .end(callback);
}

NetworkPlan.recalculate_route = function(route_id, callback) {
  txain(function(callback) {
    var sql = 'DELETE FROM custom.route_edges WHERE route_id=$1'
    database.query(sql, [route_id], callback);
  })
  .then(function(callback) {
    var sql = 'UPDATE custom.route SET updated_at=NOW() WHERE id=$1'
    database.query(sql, [route_id], callback);
  })
  .then(function(callback) {
    var sql = multiline(function() {;/*
      WITH edges AS (
        SELECT DISTINCT edge_id FROM
          (SELECT id as edge_id
              FROM
                pgr_kdijkstraPath('SELECT id, source::integer, target::integer, edge_length::double precision AS cost FROM client.graph',
                  (select vertex_id from custom.route_sources where route_id=$1 limit 1)::integer,
                  array(select vertex_id from custom.route_targets where route_id=$1)::integer[],
                  false, false) AS dk
              JOIN client.graph edge
                ON edge.id = dk.id3) as edge_id
      )
      INSERT INTO custom.route_edges (edge_id, route_id) (SELECT edge_id, $1 as route_id FROM edges);
    */});
    database.execute(sql, [route_id], function(err) {
      if (err && err.message.indexOf('One of the target vertices was not found or several targets are the same') >= 0) return callback(); // ignore this error
      if (err && err.message.indexOf('None of the target vertices has been found') >= 0) return callback(); // ignore this error
      return callback(err);
    });
  })
  .end(callback);
};

NetworkPlan.recalculate_and_find_route = function(route_id, callback) {
  txain(function(callback) {
    NetworkPlan.recalculate_route(route_id, callback);
  })
  .then(function(callback) {
    NetworkPlan.find_route(route_id, callback);
  })
  .end(callback);
};

NetworkPlan.find_all = function(callback) {
  var sql = 'SELECT id, name, area_name, ST_AsGeoJSON(area_centroid)::json as area_centroid, ST_AsGeoJSON(area_bounds)::json as area_bounds, created_at, updated_at FROM custom.route;';
  database.query(sql, callback);
};

NetworkPlan.create_route = function(name, area, callback) {

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
        VALUES ($1, $2, ST_GeomFromText($3), ST_Envelope(ST_GeomFromText($4)), NOW(), NOW()) RETURNING id;
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
      var sql = 'SELECT id, name, area_name, ST_AsGeoJSON(area_centroid)::json as area_centroid, ST_AsGeoJSON(area_bounds)::json as area_bounds, created_at, updated_at FROM custom.route WHERE id=$1;';
      database.findOne(sql, [row.id], callback);
    })
    .end(callback);
  }, callback);
};

NetworkPlan.delete_route = function(route_id, callback) {
  var sql = multiline(function() {;/*
    DELETE FROM custom.route WHERE id=$1;
  */});
  database.execute(sql, [route_id], callback);
};

NetworkPlan.clear_route = function(route_id, callback) {
  txain(function(callback) {
    var sql = multiline(function() {;/*
      DELETE FROM custom.route_targets WHERE route_id=$1;
    */});
    database.execute(sql, [route_id], callback);
  })
  .then(function(callback) {
    var sql = multiline(function() {;/*
      DELETE FROM custom.route_sources WHERE route_id=$1;
    */});
    database.execute(sql, [route_id], callback);
  })
  .then(function(callback) {
    var sql = multiline(function() {;/*
      DELETE FROM custom.route_edges WHERE route_id=$1;
    */});
    database.execute(sql, [route_id], callback);
  })
  .then(function(callback) {
    var sql = multiline(function() {;/*
      DELETE FROM client.network_nodes WHERE route_id=$1;
    */});
    database.execute(sql, [route_id], callback);
  })
  .end(callback);
};

NetworkPlan.save_route = function(route_id, data, callback) {
  var fields = [];
  var params = [];
  var allowed_fields = ['name'];
  _.intersection(_.keys(data), allowed_fields).forEach(function(key) {
    params.push(data[key]);
    fields.push(key+'=$'+params.length);
  });
  if (fields.length === 0) return callback();

  params.push(route_id);
  var sql = 'UPDATE custom.route SET '+fields.join(', ')+', updated_at=NOW() WHERE id=$'+params.length;
  database.execute(sql, params, callback);
};

NetworkPlan.edit_route = function(route_id, changes, callback) {
  txain(function(callback) {
    add_sources(route_id, changes.insertions && changes.insertions.network_nodes, callback);
  })
  .then(function(callback) {
    add_targets(route_id, changes.insertions && changes.insertions.locations, callback);
  })
  .then(function(callback) {
    delete_sources(route_id, changes.deletions && changes.deletions.network_nodes, callback);
  })
  .then(function(callback) {
    delete_targets(route_id, changes.deletions && changes.deletions.locations, callback);
  })
  .then(function() {
    NetworkPlan.recalculate_and_find_route(route_id, callback);
  })
  .end(callback);
};

NetworkPlan.export_kml = function(route_id, callback) {
  var kml_output = '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'

  function escape(name) {
    return name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  txain(function(callback) {
    var sql = 'SELECT name FROM custom.route WHERE id=$1'
    database.findOne(sql, [route_id], callback)
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
      JOIN client.graph edge
      ON edge.id = route_edges.edge_id
      WHERE route_edges.route_id = $1
    */});
    database.query(sql, [route_id], callback)
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
    database.query(sql, [route_id], callback)
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
      JOIN client.network_nodes
      ON route_sources.network_node_id = network_nodes.id
      WHERE route_sources.route_id=$1
    */});
    database.query(sql, [route_id], callback)
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

function add_sources(route_id, network_node_ids, callback) {
  if (!_.isArray(network_node_ids) || network_node_ids.length === 0) return callback();

  txain(function(callback) {
    // avoid duplicates
    var sql = multiline(function() {;/*
      DELETE FROM custom.route_sources
      WHERE route_id=$1 AND network_node_id IN ($2)
    */});
    database.execute(sql, [route_id, network_node_ids], callback);
  })
  .then(function(callback) {
    // calculate closest vertex
    var sql = multiline(function() {;/*
      INSERT INTO custom.route_sources (vertex_id, network_node_id, route_id)
      (SELECT
        vertex.id AS vertex_id, network_nodes.id, $2
      FROM
        client.graph_vertices_pgr AS vertex
      JOIN client.network_nodes network_nodes
        ON network_nodes.geom && vertex.the_geom
      WHERE
        network_nodes.id IN ($1))
    */});
    database.execute(sql, [network_node_ids, route_id], callback);
  })
  .end(callback);
};

function add_targets(route_id, location_ids, callback) {
  if (!_.isArray(location_ids) || location_ids.length === 0) return callback();

  txain(function(callback) {
    // avoid duplicates
    var sql = multiline(function() {;/*
      DELETE FROM custom.route_targets
      WHERE route_id=$1 AND location_id IN ($2)
    */});
    database.execute(sql, [route_id, location_ids], callback);
  })
  .then(function(callback) {
    // calculate closest vertex
    var sql = multiline(function() {;/*
      INSERT INTO custom.route_targets (vertex_id, location_id, route_id)
      (SELECT
        vertex.id AS vertex_id, locations.id, $2 AS route_id
      FROM
        client.graph_vertices_pgr AS vertex
      JOIN aro.locations locations
        ON locations.geom && vertex.the_geom
      WHERE
        locations.id IN ($1))
    */});
    database.execute(sql, [location_ids, route_id], callback);
  })
  .end(callback);
};

function delete_sources(route_id, network_node_ids, callback) {
  if (!_.isArray(network_node_ids) || network_node_ids.length === 0) return callback();

  txain(network_node_ids)
  .each(function(network_node_id, callback) {
    var sql = multiline(function() {;/*
      DELETE FROM custom.route_sources
      WHERE route_id=$1 AND network_node_id=$2
    */});
    database.execute(sql, [route_id, network_node_id], callback);
  })
  .then(function() {
    NetworkPlan.recalculate_and_find_route(route_id, callback);
  })
  .end(callback);
};

function delete_targets(route_id, location_ids, callback) {
  if (!_.isArray(location_ids) || location_ids.length === 0) return callback();

  txain(location_ids)
  .each(function(location_id, callback) {
    var sql = multiline(function() {;/*
      DELETE FROM custom.route_targets
      WHERE route_id=$1 AND location_id=$2
    */});
    database.execute(sql, [route_id, location_id], callback);
  })
  .end(callback);
};

module.exports = NetworkPlan;
