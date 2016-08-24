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
	monthly_recurring_cost numeric,
	source varchar,
	geog geography (POINT, 4326),
	geom geometry (POINT, 4326),
	CONSTRAINT aro_businesses_pkey PRIMARY KEY (id)
);

-- Insert all VZ customers
INSERT INTO aro.businesses(location_id, industry_id, name, address, number_of_employees, annual_recurring_cost, monthly_recurring_cost, source, geog, geom)
	SELECT
		l.id,
		(SELECT id FROM aro.industries WHERE description = 'MENS & BOYS CLOTHING STORES'), -- Generic SIC4, try to force categorization as retail
		b.nasp_nm,
		b.prism_formatted_address,
		1000,
		b.sum_mrc * 12,
		b.sum_mrc,
		'vz_customers',
    ST_SetSRID(ST_MakePoint(b.long, b.lat), 4326)::geography AS geog,
    ST_SetSRID(ST_MakePoint(b.long, b.lat), 4326) AS geom
   FROM businesses.vz_customers b
   JOIN aro.locations l
   	ON ST_Equals(l.geom, ST_SetSRID(ST_MakePoint(b.long, b.lat), 4326));

-- Insert all TAMs
INSERT INTO aro.businesses(location_id, industry_id, name, address, number_of_employees, source, geog, geom)
	SELECT
		l.id,
		(SELECT id FROM aro.industries WHERE description = 'MENS & BOYS CLOTHING STORES'), -- Generic SIC4, try to force categorization as retail
		b.business_nm,
		b.street_addr,
		b.emp_here,
		'tam',
		ST_SetSRID(ST_MakePoint(arcgis_longitude, arcgis_latitude), 4326)::geography AS geog,
    ST_SetSRID(ST_MakePoint(arcgis_longitude, arcgis_latitude), 4326) AS geom
   FROM businesses.tam b
   JOIN aro.locations l
   	ON ST_Equals(l.geom, ST_SetSRID(ST_MakePoint(arcgis_longitude, arcgis_latitude), 4326))
   WHERE 
   	arcgis_latitude != 0 
   	AND arcgis_longitude != 0;

CREATE INDEX aro_businesses_location_index ON aro.businesses(location_id);
CREATE INDEX aro_businesses_industry_index ON aro.businesses(industry_id);
CREATE INDEX aro_businesses_geog_index ON aro.businesses USING gist(geog);
CREATE INDEX aro_businesses_geom_index ON aro.businesses USING gist(geom);

CREATE EXTENSION unaccent;
