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

RouteOptimizer.calculate_fiber_cost = function(edges, cost_per_meter, callback) {
  return cost_per_meter * edges.map(function(edge) {
    return edge.edge_length;
  })
  .reduce(function(total, current) {
    return total + current
  }, 0);
};

RouteOptimizer.calculate_locations_cost = function(route_id, callback) {
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
  database.findValue(sql, [route_id], 'locations_cost', 0, callback);
};

RouteOptimizer.calculate_equipment_nodes_cost = function(route_id, output, callback) {
  txain(function(callback) {
    var sql = multiline(function() {;/*
      SELECT
        nt.name, COUNT(*)
      FROM
        client.network_nodes n
      JOIN
        client.netowrk_node_types nt
      ON
        nt.id = n.node_type_id
      WHERE
        route_id=$1
      GROUP BY nt.id
    */});
    database.query(sql, [route_id], callback);
  })
  .end(callback);
};

RouteOptimizer.calculate_npv = function(route_id, fiber_cost, callback) {
  txain(function(callback) {
    var year = new Date().getFullYear();
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
        AND spend.year <= $2
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
    database.query(sql, [route_id, year], callback);
  })
  .then(function(route_annual_revenues, callback) {
    route_annual_revenues = route_annual_revenues.reverse(); // sort in ascending order

    // Calculate NPV
    // route_annual_revenues = Annual route revenues based on revenues generated from 5 years total spends from customers connected to route

    // Total up front costs, used ONLY in the first year of NPV
    // fiber_cost = Total cost of laying the new fiber
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

    callback(null, annual_pvs);
  })
  .end(callback);
};

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

    var sql = multiline(function(){;/*
      SELECT
        ct.id, ct.name, COUNT(*)::integer AS total
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
      JOIN
        client.customer_types ct
      ON
        ct.id=bct.customer_type_id
      WHERE
        route_id=$1
      GROUP BY ct.id
      ORDER BY ct.name
    */});
    database.query(sql, [route_id], callback);
  })
  .then(function(customer_types, callback) {
    output.metadata.customer_types = customer_types;
    output.metadata.customers_total = customer_types.reduce(function(total, customer_type) {
      return total + customer_type.total;
    }, 0);

    var year = new Date().getFullYear();
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
        AND spend.year <= $2
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
    database.query(sql, [route_id, year], callback);
  })
  .then(function(route_annual_revenues, callback) {
    route_annual_revenues = route_annual_revenues.reverse(); // sort in ascending order

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

    output.metadata.npv = annual_pvs;
    callback(null, output);
  })
  .end(callback);
}

module.exports = RouteOptimizer;
