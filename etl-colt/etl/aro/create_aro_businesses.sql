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

-- COLT BUSINESSES
--
--
-- Load existing Colt customers from source_colt.customers by mapping building_id
INSERT INTO aro.businesses(location_id, name, industry_id, number_of_employees, geog)
	SELECT
		locations.id AS location_id,
		customers.cust_name AS name,
		customers.db_sic_code AS industry_id,
		customers.db_employee_total AS number_of_employees,
		locations.geog as geog
	FROM source_colt.customers customers
	JOIN aro.locations locations ON
	customers.building_id = locations.building_id;

-- Prospects have no building_id, so we need to map them geographically.
-- Generate a view of the list of prospects which match and don't match geographically.
CREATE OR REPLACE VIEW source_colt.prospects_locations_gaps AS
	SELECT 
		locations.id AS location_id,
		prospects.company_name AS name,
		prospects.address AS address,
		prospects.city AS city,
		prospects.postcode AS postcode,
		prospects.employees AS number_of_employees,
		prospects.lat AS lat,
		prospects.lon AS lon
	FROM source_colt.prospects prospects
	LEFT JOIN aro.locations locations
	ON ST_Equals(locations.geom, ST_SetSRID(ST_Point(prospects.lon, prospects.lat),4326));

-- Create locations for all prospect_location_overlaps which don't overlap 
INSERT INTO aro.locations(address, city, postal_code, country, lat, lon, geog, geom)
	SELECT
		address,
		city,
		postcode AS postal_code,
		'Germany' AS country,
		lat,
		lon,
		ST_SetSRID(ST_Point(lon, lat),4326)::geography as geog,
		ST_SetSRID(ST_Point(lon, lat),4326) as geom
	FROM source_colt.prospects_locations_gaps
	WHERE location_id IS NULL;

DROP VIEW source_colt.prospects_locations_gaps;

-- Recreate the view now that we have location records for each prospect
CREATE OR REPLACE VIEW source_colt.prospect_locations AS
	SELECT 
		locations.id AS location_id,
		prospects.company_name AS name,
		prospects.address AS address,
		prospects.city AS city,
		prospects.postcode AS postcode,
		prospects.employees AS number_of_employees,
		prospects.sic_4 AS industry_id,
		prospects.lat AS lat,
		prospects.lon AS lon,
		locations.geom AS geog
	FROM source_colt.prospects prospects
	LEFT JOIN aro.locations locations
	ON ST_Equals(locations.geom, ST_SetSRID(ST_Point(prospects.lon, prospects.lat),4326));

-- Insert all prospects into businesses table, map by 
INSERT INTO aro.businesses(location_id, name, address, industry_id, number_of_employees, geog)
	SELECT 
		location_id,
		name,
		address,
		industry_id,
		number_of_employees,
		geog
	FROM source_colt.prospect_locations;

DROP VIEW source_colt.prospect_locations;

CREATE INDEX aro_businesses_location_index ON aro.businesses(location_id);
CREATE INDEX aro_businesses_industry_index ON aro.businesses(industry_id);
CREATE INDEX aro_businesses_geog_index ON aro.businesses USING gist(geog);



