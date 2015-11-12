// Location
//
// A Location is a point in space which can contain other objects such as businesses and households

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');
var config = helpers.config;
var MarketSize = require('./market_size');

var Location = {};

// Find all Locations
//
// 1. callback: function to return a GeoJSON object
Location.find_all = function(plan_id, type, filters, viewport, callback) {
	txain(function(callback) {
	  database.query('SELECT * FROM client_schema.customer_types', callback)
	})
	.then(function(customer_types, callback) {
		var params = [];
		var sql = 'SELECT locations.id, ST_AsGeoJSON(locations.geog)::json AS geom';
		customer_types.forEach(function(customer_type) {
			params.push(customer_type.id);
			sql += '\n\t, (SELECT COUNT(*)::integer FROM businesses b JOIN client_schema.business_customer_types bct ON b.id = bct.business_id AND bct.customer_type_id=$'+params.length;
			sql += ' WHERE b.location_id = locations.id)'
			sql += ' AS customer_type_'+customer_type.name.toLowerCase().replace(/\s+/g, '');
		})
		sql += '\n FROM aro.locations';
		if (type === 'businesses') {
			sql += '\n JOIN businesses b ON b.location_id = locations.id';
			sql += '\n JOIN client_schema.industry_mapping m ON m.sic4 = b.industry_id JOIN client_schema.industries i ON m.industry_id = i.id';
			if (filters.industries.length > 0) {
				params.push(filters.industries)
				sql += '\n AND m.industry_id IN ($'+params.length+')';
			}
			if (filters.customer_types.length > 0) {
				params.push(filters.customer_types)
				sql += '\n JOIN client_schema.business_customer_types ON b.id = business_customer_types.business_id AND business_customer_types.customer_type_id IN ($'+params.length+')';
			}
			if (filters.number_of_employees.length > 0) {
				params.push(filters.number_of_employees)
				sql += '\n JOIN client_schema.employees_by_location e ON e.min_value <= b.number_of_employees AND e.max_value >= b.number_of_employees AND e.id IN ($'+params.length+')';
			}
		} else if (type === 'households') {
			sql += ' JOIN households ON households.location_id = locations.id';
		}
		params.push(viewport.linestring);
		sql += '\n WHERE ST_Contains(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($'+params.length+')), 4326), locations.geom)'
		sql += ' GROUP BY locations.id';
		database.query(sql, params, callback);
	})
	.then(function(rows, callback) {
		var features = rows.map(function(row) {
			var icon = void(0);
			var total = (row.customer_type_existing || 0) + (row.customer_type_prospect || 0);
			if (row.customer_type_existing > total/2) icon = '/images/map_icons/location_existing.png';
			if (row.customer_type_prospect > total/2) icon = '/images/map_icons/location_prospect.png';
			return {
				'type':'Feature',
				'properties': {
					'id': row.id,
					'icon': icon,
				},
				'geometry': row.geom,
			};
		});

		var output = {
			'feature_collection': {
				'type':'FeatureCollection',
				'features': features,
			},
		};
		callback(null, output);
	})
	.end(callback);
};

// Density for locations
//
// 1. callback: function to return a GeoJSON object
Location.density = function(plan_id, viewport, callback) {
	txain(function(callback) {
		var params = [];
		var sql = 'WITH '+viewport.fishnet;
		sql += multiline(function() {;/*
			SELECT ST_AsGeojson(fishnet.geom)::json AS geom, COUNT(*) AS density, NULL AS id
			FROM fishnet
			JOIN locations ON fishnet.geom && locations.geom
			GROUP BY fishnet.geom
		*/});
		if (config.route_planning) {
			params.push(plan_id);
			sql += multiline(function() {;/*
				UNION ALL

				-- Always return selected locations
				SELECT ST_AsGeoJSON(geog)::json AS geom, NULL AS density, locations.id
					FROM aro.locations
					JOIN custom.route_targets
					ON route_targets.route_id=$1
					AND route_targets.location_id=locations.id
			*/});
		}
		database.query(sql, params, callback);
	})
	.then(function(rows, callback) {
		var features = rows.map(function(row) {
			return {
				'type':'Feature',
				'properties': {
					'id': row.id,
					'density': viewport.zoom > 9 ? row.density : null,
				},
				'geometry': row.geom,
			};
		});

		var output = {
			'feature_collection': {
				'type':'FeatureCollection',
				'features': features,
			},
		};
		callback(null, output);
	})
	.end(callback);
};

// Get summary information for a given location
//
// 1. location_id: integer. ex. 1738
// 2. callback: function to return the information
Location.show_information = function(location_id, callback) {
	var info;
	txain(function(callback) {
		var sql = multiline(function() {;/*
			select
			  location_id,
			  sum(entry_fee)::integer as entry_fee,
			  sum(install_cost)::integer as business_install_costs,
			  sum(install_cost_per_hh)::integer as household_install_costs,
			  sum(number_of_households)::integer as number_of_households,
			  sum(number_of_businesses)::integer as number_of_businesses
			from (
			  select
			    location_id, entry_fee, 0 as install_cost, 0 as install_cost_per_hh, 0 as number_of_households, 0 as number_of_businesses
			  from
			    client_schema.location_entry_fees
			  where
			    location_id=$1

			  union

			  select
			    location_id, 0, install_cost, 0, 0, 0
			  from
			    client_schema.business_install_costs
			  join businesses
			    on businesses.id = business_install_costs.business_id
			  where
			    location_id=$1

			  union

			  select
			    location_id, 0, 0, install_cost_per_hh, 0, 0
			  from
			    client_schema.household_install_costs
			  where
			    location_id=$1

			  union

			  select
			    location_id, 0, 0, 0, households.number_of_households, 0
			  from
			    aro.households
			  where
			    households.location_id=$1

			  union

			  select
			    location_id, 0, 0, 0, 0, count(*)
			  from
			    businesses
			  where
			    location_id=$1
			  group by
			    location_id

			) t group by location_id;
		*/});
		database.findOne(sql, [location_id], {}, callback);
	})
	.then(function(_info, callback) {
		info = _info;
		var sql = multiline(function() {;/*
			SELECT ct.name, SUM(households)::integer as households, SUM(businesses)::integer as businesses FROM (
			  (SELECT
			    bct.customer_type_id as id, COUNT(*)::integer AS businesses, 0 as households
			  FROM
			    businesses b
			  JOIN
			    client_schema.business_customer_types bct
			  ON
			    bct.business_id = b.id
			  WHERE
			    b.location_id=$1
			  GROUP BY bct.customer_type_id)

			  UNION

			  (SELECT
			    hct.customer_type_id as id, 0 as businesses, COUNT(*)::integer AS households
			  FROM
			    households h
			  JOIN
			    client_schema.household_customer_types hct
			  ON
			    hct.household_id = h.id
			  WHERE
			    h.location_id=$1
			  GROUP BY hct.customer_type_id)

			  ) t
			JOIN
			  client_schema.customer_types ct
			ON
			  ct.id=t.id
			GROUP BY
			  ct.name
			ORDER BY
			  ct.name
		*/});
		database.query(sql, [location_id], callback);
	})
	.then(function(customer_types, callback) {
		info.customer_types = customer_types;

		info.customers_businesses_total = customer_types.reduce(function(total, customer_type) {
			return total + customer_type.businesses;
		}, 0);
		info.customers_households_total = customer_types.reduce(function(total, customer_type) {
			return total + customer_type.households;
		}, 0);

		callback(null, info);
	})
	.end(callback);
}

Location.create_location = function(values, callback) {
	var location_id;
	var type = values.type;

	txain(function(callback) {
		var params = [
			values.address,
			values.lat,
			values.lon,
			values.city,
			values.state,
			values.zipcode,
			'POINT('+values.lon+' '+values.lat+')',
			'POINT('+values.lon+' '+values.lat+')',
		]
		var sql = multiline(function() {;/*
			INSERT INTO aro.locations
				(address, lat, lon, city, state, zipcode, geog, geom)
			VALUES ($1, $2, $3, $4, $5, $6, ST_GeogFromText($7), ST_GeomFromText($8, 4326))
			RETURNING id
		*/});
		database.findOne(sql, params, callback);
	})
	.then(function(row, callback) {
		location_id = row.id;

		if (type === 'commercial') {
			insert_business(callback);
		} else if (type === 'residential') {
			insert_household(callback);
		} else if (type === 'combo') {
			txain(function(callback) {
				insert_business(callback);
			})
			.then(function(callback) {
				insert_household(callback);
			})
			.end(callback);
		} else {
			callback();
		}
	})
	.then(function(callback) {
		var sql = 'SELECT id, ST_AsGeoJSON(geog)::json AS geom FROM aro.locations WHERE id=$1';
		database.findOne(sql, [location_id], callback);
	})
	.then(function(row, callback) {
		callback(null, {
			'type':'Feature',
			'properties': {
				'id': row.id,
			},
			'geometry': row.geom,
		});
	})
	.end(callback);

	function insert_business(callback) {
		var business_id;
		txain(function(callback) {
			var sql = 'INSERT INTO businesses (location_id, industry_id, name, address, number_of_employees) VALUES ($1, $2, $3, $4, $5) RETURNING id';
			var params = [
				location_id,
				values.business_industry && values.business_industry.id,
				values.business_name,
				values.address,
				+values.number_of_employees,
			];
			database.findOne(sql, params, callback);
		})
		.then(function(row, callback) {
			business_id = row.id;

			var sql = 'INSERT INTO client_schema.business_install_costs (business_id, install_cost, annual_recurring_cost) VALUES ($1, $2, $3)';
			var params = [
				business_id,
				+values.install_cost,
				+values.annual_recurring_cost,
			];
			database.execute(sql, params, callback);
		})
		.then(function(callback) {
			var sql = 'INSERT INTO client_schema.business_customer_types (business_id, customer_type_id) VALUES ($1, $2)';
			var params = [
				business_id,
				values.business_customer_type && values.business_customer_type.id,
			];
			database.execute(sql, params, callback);
		})
		.end(callback);
	}

	function insert_household(callback) {
		var household_id;
		txain(function(callback) {
			var sql = 'INSERT INTO households (location_id, number_of_households) VALUES ($1, $2) RETURNING id';
			var params = [
				location_id,
				+values.number_of_households,
			];
			database.findOne(sql, params, callback);
		})
		.then(function(row, callback) {
			household_id = row.id;

			var sql = 'INSERT INTO client_schema.household_customer_types (household_id, customer_type_id) VALUES ($1, $2)';
			var params = [
				household_id,
				values.household_customer_type && values.household_customer_type.id,
			];
			database.execute(sql, params, callback);
		})
		.end(callback);
	}

};

Location.find_industries = function(callback) {
	var sql = 'SELECT id, industry_name as description FROM client_schema.industries ORDER BY industry_name ASC'
	database.query(sql, [], callback);
};

Location.customer_types = function(callback) {
	var sql = 'SELECT * FROM client_schema.customer_types ORDER BY name ASC'
	database.query(sql, [], callback);
};

Location.update_households = function(location_id, values, callback) {
	var params = [
		values.number_of_households,
		location_id,
	];
	txain(function(callback) {
		var sql = multiline(function() {;/*
			UPDATE aro.households
			SET
				number_of_households = $1
			WHERE
				location_id = $2;
		*/});
		database.execute(sql, params, callback);
	})
	.then(function(rowCount, callback) {
		if (rowCount > 0) return callback(null, 1);
		var sql = multiline(function() {;/*
			INSERT INTO aro.households
				(number_of_households, location_id)
			VALUES ($1, $2)
		*/});
		database.execute(sql, params, callback);
	})
	.end(callback);
}

Location.show_businesses = function(location_id, callback) {
	var sql = multiline(function() {;/*
		SELECT
			businesses.id,
			businesses.industry_id,
			businesses.name,
			businesses.number_of_employees,
			businesses.address,
			costs.install_cost::float,
			costs.annual_recurring_cost::float,
			industries.description AS industry_description,
			ct.name as customer_type
		FROM
			aro.businesses businesses
		JOIN client_schema.business_install_costs costs
			ON costs.business_id = businesses.id
		LEFT JOIN industries
			ON industries.id = businesses.industry_id
		JOIN client_schema.business_customer_types bct
			ON bct.business_id = businesses.id
		JOIN client_schema.customer_types ct
			ON ct.id = bct.customer_type_id
		WHERE
			location_id = $1
	*/});
	database.query(sql, [location_id], callback);
};

// Get available filters
Location.filters = function(callback) {
  var output = {};
  txain(function(callback) {
    var sql = 'SELECT * FROM client_schema.employees_by_location';
    database.query(sql, callback);
  })
  .then(function(rows, callback) {
    output.employees_by_location = rows;

    var sql = 'SELECT * FROM client_schema.industries';
    database.query(sql, callback);
  })
  .then(function(rows, callback) {
    output.industries = rows;

    var sql = 'SELECT * FROM client_schema.customer_types';
    database.query(sql, callback);
  })
  .then(function(rows, callback) {
    output.customer_types = rows;

    callback(null, output);
  })
  .end(callback);
};

module.exports = Location;
