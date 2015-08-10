// Route Optimizer 
//
// The Route Optimizer finds shortest paths between sources and targets

var helpers = require('../helpers');
var database = helpers.database;
var multiline = require('multiline');
var txain = require('txain');
var Location = require('./location');
var _ = require('underscore');

var RouteOptimizer = {};

RouteOptimizer.find_route = function(route_id, callback) {
  var cost_per_meter = 200;
  var output = {};

  txain(function(callback) {
    var sql = multiline(function() {;/*
      SELECT edge.id, edge.edge_length, ST_AsGeoJSON(edge.geom)::json AS geom
      FROM custom.route_edges
      JOIN client.graph edge
        ON edge.id = route_edges.edge_id
      WHERE route_edges.route_id=$1
    */});
    database.query(sql, [route_id], callback);
  })
  .then(function(rows, callback) {
    var features = rows.map(function(row) {
      return {
        'type':'Feature',
        'properties': {
          'length_in_meters': row.edge_length,
        },
        'geometry': row.geom,
      }
    });

    var feature_collection = {
      'type':'FeatureCollection',
      'features': features,
    };

    var metadata = {
      'fiber_cost': fiber_cost_of_route(feature_collection, cost_per_meter),
    };

    output = {
      'feature_collection': feature_collection,
      'metadata': metadata
    };
    callback();
  })
  .then(function(callback) {
    var sql = multiline(function() {;/*
      select
        sum(location_total)::integer as locations_cost
      from
        (select
          $1 as route_id,
          (entry_fee + business_install_costs * number_of_businesses + household_install_costs * number_of_households) as location_total
        from (
          select
            location_id,
            sum(entry_fee)::integer as entry_fee,
            sum(install_cost)::integer as business_install_costs,
            sum(install_cost_per_hh)::integer as household_install_costs,
            sum(number_of_households)::integer as number_of_households,
            sum(number_of_businesses)::integer as number_of_businesses
          from (
            select
              location_entry_fees.location_id as location_id, entry_fee, 0 as install_cost, 0 as install_cost_per_hh, 0 as number_of_households, 0 as number_of_businesses
            from
              client.location_entry_fees
            join custom.route_targets on
              location_entry_fees.location_id = route_targets.location_id
              and route_targets.route_id=$1

            union

            select
              businesses.location_id, 0, install_cost, 0, 0, 0
            from
              client.business_install_costs
            join businesses
              on businesses.id = business_install_costs.business_id
            join custom.route_targets on
              businesses.location_id = route_targets.location_id
              and route_targets.route_id=$1

            union

            select
              household_install_costs.location_id, 0, 0, install_cost_per_hh, 0, 0
            from
              client.household_install_costs
            join custom.route_targets on
              household_install_costs.location_id = route_targets.location_id
              and route_targets.route_id=$1

            union

            select
              households.location_id, 0, 0, 0, households.number_of_households, 0
            from
              aro.households
            join custom.route_targets on
              households.location_id = route_targets.location_id
              and route_targets.route_id=$1

            union

            select
              businesses.location_id, 0, 0, 0, 0, count(*)
            from
              businesses
            join custom.route_targets on
              businesses.location_id = route_targets.location_id
              and route_targets.route_id=$1
            group by
              businesses.location_id

          ) t group by location_id
        ) t
      ) t group by route_id;
    */});
    database.findOne(sql, [route_id], callback);
  })
  .then(function(row, callback) {
    var locations_cost = (row && row.locations_cost) || 0;
    output.metadata.locations_cost = locations_cost;
    output.metadata.total_cost = locations_cost + output.metadata.fiber_cost;

    var sql = multiline(function() {;/*
      SELECT location_id AS id
      FROM custom.route_targets
      WHERE route_id=$1
    */});
    database.query(sql, [route_id], callback);
  })
  .then(function(targets, callback) {
    output.metadata.targets = targets.map(function(row) { return +row.id });
    var sql = multiline(function() {;/*
      SELECT network_node_id AS id
      FROM custom.route_sources
      WHERE route_id=$1
    */});
    database.query(sql, [route_id], callback);
  })
  .then(function(sources, callback) {
    output.metadata.sources = sources.map(function(row) { return +row.id });

    var sql = multiline(function() {;/*
      SELECT
        spend.year, SUM(spend.monthly_spend * 12)::float as total
      FROM
        custom.route_targets
      JOIN
        businesses b
      ON
        route_targets.location_id = b.location_id
      JOIN
        client.industry_mapping m
      ON
        m.sic4 = b.industry_id
      JOIN
        client.spend
      ON
        spend.industry_id = m.industry_id
        AND spend.monthly_spend <> 'NaN'
      JOIN
        client.employees_by_location e
      ON
        e.id = spend.employees_by_location_id
        AND e.min_value <= b.number_of_employees
        AND e.max_value >= b.number_of_employees
      WHERE
        route_targets.route_id=$1
      GROUP BY
        spend.year
      ORDER BY spend.year DESC LIMIT 5
    */});
    database.query(sql, [route_id], callback);
  })
  .then(function(route_annual_revenues, callback) {
    // Calculate NPV
    // route_annual_revenues = Annual route revenues based on revenues generated from 5 years total spends from customers connected to route

    // Total up front costs, used ONLY in the first year of NPV
    var fiber_cost = output.metadata.fiber_cost; // Total cost of laying the new fiber
    var commission_rate = 3.30; // Commission rate on sales of new accounts - this is a variable that might go away

    // Annual recurring costs
    var customer_cost_rate = 0.2; // Per year, we assume route costs are 20% of the route revenue for that year
    var discount_rate = 0.05; // Arbitrarily assigned as 5%. This value may differ between clients.

    // Present Values for 5 years
    var annual_pvs = [];

    // Get Present Value of route for each year in 5 year period
    route_annual_revenues.forEach(function(row) {
      var revenue = row.total;
      var costs = 0;
      if (annual_pvs.length === 0) {
        // Year 1 Present Value includes fixed costs as well as recurring costs
        costs += fiber_cost;
        costs += (revenue / 12) * commission_rate; // commission cost uses monthly revenue so I just divided annual to get it
        costs += revenue * customer_cost_rate;
      } else {
        // Other years just include recurring costs
        costs += revenue * customer_cost_rate;
      }
      var cash_flow = revenue - costs;
      var pv = cash_flow / Math.pow(1+discount_rate, 1+annual_pvs.length);

      annual_pvs.push({
        year: row.year + route_annual_revenues.length,
        value: pv,
      });
    });

    output.metadata.npv = annual_pvs.reverse();
    callback(null, output);
  })
  .end(callback);
}

RouteOptimizer.recalculate_route = function(route_id, callback) {
  txain(function(callback) {
    var sql = 'DELETE FROM custom.route_edges WHERE route_id=$1'
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

RouteOptimizer.recalculate_and_find_route = function(route_id, callback) {
  txain(function(callback) {
    RouteOptimizer.recalculate_route(route_id, callback);
  })
  .then(function(callback) {
    RouteOptimizer.find_route(route_id, callback);
  })
  .end(callback);
};

// Get the total fiber cost of a route
//
// route: GeoJSON FeatureCollection output by the `shortest_path` function above
// cost_per_meter: decimal number. ex. 12.3
function fiber_cost_of_route(route, cost_per_meter) {
  return cost_per_meter * route.features.map(function(feature) {
    return feature.properties.length_in_meters
  })
  .reduce(function(total, current) {
    return total + current
  }, 0);
};

RouteOptimizer.find_all = function(callback) {
  var sql = 'SELECT id, name, number_of_strands FROM custom.route;';
  database.query(sql, callback);
};

RouteOptimizer.create_route = function(callback) {
  txain(function(callback) {
    var sql = 'INSERT INTO custom.route (name) VALUES ($1) RETURNING id;';
    database.findOne(sql, ['Untitled route'], callback);
  })
  .then(function(row, callback) {
    var sql = 'SELECT id, name, number_of_strands FROM custom.route WHERE id=$1;';
    database.findOne(sql, [row.id], callback);
  })
  .end(callback);
};

RouteOptimizer.delete_route = function(route_id, callback) {
  var sql = multiline(function() {;/*
    DELETE FROM custom.route WHERE id=$1;
  */});
  database.execute(sql, [route_id], callback);
};

RouteOptimizer.clear_route = function(route_id, callback) {
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
  .end(callback);
};

RouteOptimizer.save_route = function(route_id, data, callback) {
  var fields = [];
  var params = [];
  var allowed_fields = ['name'];
  _.intersection(_.keys(data), allowed_fields).forEach(function(key) {
    params.push(data[key]);
    fields.push(key+'=$'+params.length);
  });
  if (fields.length === 0) return callback();

  params.push(route_id);
  var sql = 'UPDATE custom.route SET '+fields.join(', ')+' WHERE id=$'+params.length;
  database.execute(sql, params, callback);
};

RouteOptimizer.edit_route = function(route_id, changes, callback) {
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
    RouteOptimizer.recalculate_and_find_route(route_id, callback);
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
    RouteOptimizer.recalculate_and_find_route(route_id, callback);
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

module.exports = RouteOptimizer;
