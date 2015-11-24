-- Table: aro.businesses

DROP TABLE IF EXISTS aro.businesses;

CREATE TABLE aro.businesses
(
	id serial,
	location_id bigint,
	industry_id int,
	name varchar,
	address varchar,
	number_of_employees integer,
	annual_recurring_cost numeric,
	geog geography (POINT, 4326),
	CONSTRAINT aro_businesses_pkey PRIMARY KEY (id)
);

-- Create a table for later assigning customer type to existing customers
DROP TABLE IF EXISTS aro.existing_customer_business_ids;
CREATE TABLE aro.existing_customer_business_ids
(
	id int
);

-- Map existing Colt customers to existing locations
WITH existing_customer_business_ids AS
(
INSERT INTO aro.businesses(location_id, name, industry_id, number_of_employees, geog)
	SELECT
		locations.id AS location_id,
		customers.cust_name AS name,
		customers.db_sic_code AS industry_id,
		customers.man_employee_total AS number_of_employees,
		locations.geog as geog
	FROM source_colt.customers customers
	JOIN aro.locations locations ON
	customers.building_id = locations.building_id
	WHERE customers.man_employee_total >= 10
	RETURNING id
)
INSERT INTO aro.existing_customer_business_ids(id)
	SELECT
		id
	FROM existing_customer_business_ids;

-- Create temp table for central matching of prospects
DROP TABLE IF EXISTS source_colt.prospect_location;
CREATE TABLE source_colt.prospect_location AS
	SELECT
		row_number() OVER () AS id,
		prospects.country,
		prospects.lon,
		prospects.lat,
		ST_SetSRID(ST_Point(prospects.lon, prospects.lat),4326)::geometry AS geom
	FROM (SELECT DISTINCT country, lon, lat FROM source_colt.prospects WHERE employees >= 10) prospects
	WHERE prospects.lat != 0 AND prospects.lon != 0;

-- Finds existing locations which match prospect locations
DROP TABLE IF EXISTS source_colt.prospects_locations_matched;
CREATE TABLE source_colt.prospects_locations_matched AS
	WITH matching_locations AS
	(
		SELECT
			l.id AS location_id,
			pl.id AS prospect_location_id,
			ST_Distance(pl.geom::geography, l.geog) AS distance
		FROM source_colt.prospect_location pl
		JOIN aro.locations l
		ON ABS(l.lat - pl.lat) < .00001 AND ABS(l.lon - pl.lon) < .00001
	),
	exact_locations AS
	(
		SELECT
			prospect_location_id,
			min(distance) AS min_distance
		FROM matching_locations
		GROUP BY prospect_location_id
	)
	SELECT
		ml.location_id,
		el.prospect_location_id
	FROM exact_locations el
	JOIN matching_locations ml
	ON ml.prospect_location_id = el.prospect_location_id AND el.min_distance = ml.distance;

-- Insert locations for all prospects which do not match existing lcoations
WITH new_locations AS
(
	INSERT INTO aro.locations(country, lat, lon, geom, geog)
		SELECT
			pl.country,
			pl.lat,
			pl.lon,
			pl.geom,
			pl.geom::geography AS geog
		FROM source_colt.prospect_location pl
		LEFT JOIN source_colt.prospects_locations_matched plm
		ON plm.prospect_location_id = pl.id
		WHERE plm.location_id IS NULL
		RETURNING id, lat, lon
)
INSERT INTO source_colt.prospects_locations_matched(location_id, prospect_location_id)
	SELECT
		new_locations.id,
		pl.id
	FROM new_locations
	JOIN source_colt.prospect_location pl
	ON new_locations.lat = pl.lat AND new_locations.lon = pl.lon;

-- Create a table for later assigning customer type to prospect customers
DROP TABLE IF EXISTS aro.prospect_customer_business_ids;
CREATE TABLE aro.prospect_customer_business_ids
(
	id int
);

-- Insert all prospects into businesses table and assign a location_id
WITH prospect_customer_business_ids AS
(
INSERT INTO aro.businesses(location_id, industry_id, name, address, number_of_employees, geog)
	SELECT
		plm.location_id AS location_id,
		p.sic_4 AS industry_id,
		p.company_name AS name,
		concat_ws(' ', p.address::text, p.address_2::text) AS address,
		p.employees AS number_of_employees,
		l.geom::geography AS geog
	FROM source_colt.prospects p
	JOIN source_colt.prospect_location pl
	ON pl.lat = p.lat AND pl.lon = p.lon
	JOIN source_colt.prospects_locations_matched plm
	ON plm.prospect_location_id = pl.id
	JOIN aro.locations l
	ON l.id = plm.location_id
	RETURNING id
)
INSERT INTO aro.prospect_customer_business_ids(id)
	SELECT
		id
	FROM prospect_customer_business_ids;


-- Drop temp tables. Could do this with a WITH statement, but...
DROP TABLE IF EXISTS source_colt.prospect_location;
DROP TABLE IF EXISTS source_colt.prospect_location_tuple;

CREATE INDEX aro_businesses_location_index ON aro.businesses(location_id);
CREATE INDEX aro_businesses_industry_index ON aro.businesses(industry_id);
CREATE INDEX aro_businesses_geog_index ON aro.businesses USING gist(geog);
