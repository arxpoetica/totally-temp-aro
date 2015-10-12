// Location 
//
// A Location is a point in space which can contain other objects such as businesses and households

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');

var Location = {};

// Find all Locations
//
// 1. callback: function to return a GeoJSON object
Location.find_all = function(type, viewport, callback) {
	if (arguments.length !== 3) {
		throw new Error('Missing parameters')
	}

	txain(function(callback) {
		if (viewport.zoom > viewport.threshold) {
			var linestring = helpers.geo.linestring_from_viewport(viewport);
			var sql = 'SELECT locations.id, ST_AsGeoJSON(locations.geog)::json AS geom FROM aro.locations';
			sql += '\n WHERE ST_Contains(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($1)), 4326), locations.geom)'
			if (type === 'businesses') {
				sql += ' JOIN businesses ON businesses.location_id = locations.id';
			} else if (type === 'households') {
				sql += ' JOIN households ON households.location_id = locations.id';
			}
			sql += ' GROUP BY locations.id';
			database.query(sql, [linestring], callback);
		} else {
			var cluster_name = 'locations_'+viewport.zoom;
			var sql = 'SELECT ST_AsGeoJSON(ST_Simplify(geom, 0.0001))::json AS geom, density FROM custom.clusters WHERE name=$1';
			var params = [cluster_name];
			txain(function(callback) {
				database.query(sql, params, callback);
			})
			.then(function(rows, callback) {
				if (rows.length > 0) return callback(null, rows);

				txain(function(callback) {
					var sql = multiline(function() {;/*
						WITH grouped AS (
							SELECT ST_Union(ST_Buffer(geom, $1, 'quad_segs=1')) AS geom
							FROM locations
							GROUP BY ST_Geohash(geom)
						), clusters AS (
							SELECT (ST_Dump(ST_Union(geom))).geom AS geom FROM grouped
						)

						INSERT INTO custom.clusters (name, geom, density, zoom)
							SELECT $2 AS name, clusters.geom, COUNT(*)/ST_Area(clusters.geom) AS density, $3 AS zoom FROM clusters
							JOIN locations ON ST_Contains(clusters.geom, locations.geom)
							GROUP BY clusters.geom
					*/});
					var params = [
						viewport.buffer,
						cluster_name,
						viewport.zoom,
					];
					database.execute(sql, params, callback);
				})
				.then(function(callback) {
					database.query(sql, params, callback);
				})
				.end(callback);
			})
			.end(callback);
		}
	})
	.then(function(rows, callback) {
		var features = rows.map(function(row) {
			return {
				'type':'Feature',
				'properties': {
					'id': row.id,
					'density': row.density, // for clusters
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
			    bct.customer_type_id as id, COUNT(*)::integer AS households, 0 as businesses
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
			    hct.customer_type_id as id, 0 as households, COUNT(*)::integer AS businesses
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
	var sql = 'SELECT * FROM industries ORDER BY description ASC'
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
			industries.description AS industry_description
		FROM
			aro.businesses businesses
		JOIN
			client_schema.business_install_costs costs
		ON
			costs.business_id = businesses.id
		JOIN
			industries
		ON
			industries.id = businesses.industry_id
		WHERE
			location_id = $1
	*/});
	database.query(sql, [location_id], callback);
}

module.exports = Location;
