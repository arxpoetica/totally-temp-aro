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

RouteOptimizer.calculate_equipment_nodes_cost = function(route_id, callback) {
  // hard coded values by now
  var cost = {
    'fiber_deployment_hub': 5000,
    'fiber_deployment_terminal': 2000,
    'splice_point': 1000,
  };
  txain(function(callback) {
    var sql = multiline(function() {;/*
      SELECT
        nt.name as key, nt.description as name, COUNT(*)::integer as count
      FROM
        client.network_nodes n
      JOIN
        client.network_node_types nt
      ON
        nt.id = n.node_type_id
      WHERE
        route_id=$1
      GROUP BY nt.id
    */});
    database.query(sql, [route_id], callback);
  })
  .then(function(nodes, callback) {
    nodes.forEach(function(node) {
      node.value = (cost[node.key] || 0) * node.count;
    });
    var total = nodes.reduce(function(total, node) {
      return total + node.value;
    }, 0);
    callback(null, {
      equipment_node_types: nodes,
      total: total,
    });
  })
  .end(callback);
};

RouteOptimizer.calculate_revenue_and_npv = function(route_id, fiber_cost, callback) {
  txain(function(callback) {
    var sql = multiline(function() {;/*
      SELECT
        spend.year, SUM(spend.monthly_spend * 12)::float as value
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
      ORDER BY spend.year
    */});
    database.query(sql, [route_id], callback);
  })
  .then(function(route_annual_revenues, callback) {
    var year = new Date().getFullYear();

    var revenue = _.filter(route_annual_revenues, function(row) {
      return row.year >= year && row.year < year+5;
    });
    var past_five_years = _.filter(route_annual_revenues, function(row) {
      return row.year >= year-5 && row.year < year;
    });
    var npv = RouteOptimizer.calculate_npv(past_five_years, fiber_cost);

    callback(null, { revenue: revenue, npv: npv });
  })
  .end(callback);
};

// Calculate NPV
// route_annual_revenues Annual route revenues based on revenues generated from 5 years total spends from customers connected to route
RouteOptimizer.calculate_npv = function(route_annual_revenues, fiber_cost) {
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
    var revenue = row.value;
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

  return annual_pvs;
};

module.exports = RouteOptimizer;
