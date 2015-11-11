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

-- Map existing Colt customers to existing locations
INSERT INTO aro.businesses(location_id, name, industry_id, number_of_employees, geog)
	SELECT
		locations.id AS location_id,
		customers.cust_name AS name,
		customers.db_sic_code AS industry_id,
		customers.db_employee_total AS number_of_employees,
		locations.geog as geog
	FROM source_colt.customers customers
	JOIN aro.locations locations ON
	customers.building_id = locations.building_id
	WHERE customers.man_employee_total >= 10;

-- Get rid of any prospects which didn't geocode
DELETE FROM source_colt.prospects WHERE lat = 0 AND lon = 0;

-- Create temp table for central matching of prospects
DROP TABLE IF EXISTS source_colt.prospect_location;
CREATE TABLE source_colt.prospect_location AS
	SELECT 
		row_number() OVER () AS id,
		prospects.country,
		prospects.lon,
		prospects.lat,
		ST_SetSRID(ST_Point(prospects.lon, prospects.lat),4326)::geometry AS geom
	FROM (SELECT DISTINCT country, lon, lat FROM source_colt.prospects) prospects;

-- Inesert any locations we need (for prospects who don't match existing customer locations) into locations table
INSERT INTO aro.locations(country, lat, lon, geom, geog)
	SELECT 
		pl.country,
		pl.lat,
		pl.lon,
		pl.geom,
		pl.geom::geography AS geog
	FROM source_colt.prospect_location pl
	LEFT JOIN aro.locations l
	ON ABS(l.lat - pl.lat) < .00001 AND ABS(l.lon - pl.lon) < .00001
	WHERE l.id IS NULL;

-- Mapping table (THIS TAKES A BIT OF TIME TO CREATE):
-- All prospects should now have a location since we added them for the ones that didn't have one
-- Need to map through locations and source_colt.prospects table to get other data
DROP TABLE IF EXISTS source_colt.prospect_location_tuple;
CREATE TABLE source_colt.prospect_location_tuple AS
	SELECT
		prospect_location.id AS prospect_location_id,
		prospects.id AS prospect_id,
		locations.id AS aro_location_id
	FROM source_colt.prospects prospects
	JOIN source_colt.prospect_location prospect_location
	ON prospects.lon = prospect_location.lon 
	AND prospects.lat = prospect_location.lat
	JOIN aro.locations locations
	ON ABS(locations.lat - prospect_location.lat) < .00001 AND ABS(locations.lon - prospect_location.lon) < .00001;

-- Insert all the prospects into the businesses table with their assigned location_id
INSERT INTO aro.businesses(location_id, name, address, geog)
	SELECT
		plt.aro_location_id AS location_id,
		p.company_name AS name,
		concat_ws(' ', p.address::text, p.address_2::text) AS address,
		pl.geom::geography AS geog
	FROM source_colt.prospect_location_tuple plt
	JOIN source_colt.prospect_location pl
	ON pl.id = plt.prospect_location_id
	JOIN source_colt.prospects p
	ON p.id = plt.prospect_id;

-- Drop temp tables. Could do this with a WITH statement, but...
DROP TABLE IF EXISTS source_colt.prospect_location;
DROP TABLE IF EXISTS source_colt.prospect_location_tuple;

CREATE INDEX aro_businesses_location_index ON aro.businesses(location_id);
CREATE INDEX aro_businesses_industry_index ON aro.businesses(industry_id);
CREATE INDEX aro_businesses_geog_index ON aro.businesses USING gist(geog);



