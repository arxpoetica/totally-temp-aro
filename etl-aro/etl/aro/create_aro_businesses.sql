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
	geom geometry (POINT, 4326),
	CONSTRAINT aro_businesses_pkey PRIMARY KEY (id)
);

CREATE INDEX aro_businesses_location_index ON aro.businesses(location_id);
CREATE INDEX aro_businesses_industry_index ON aro.businesses(industry_id);
CREATE INDEX aro_businesses_geog_index ON aro.businesses USING gist(geog);
CREATE INDEX aro_businesses_geom_index ON aro.businesses USING gist(geom);


INSERT INTO aro.businesses(id, location_id, industry_id, name, address, number_of_employees, geog, geom)
	SELECT
		sourceid as id,
		bldgid as location_id,
		sic4 as industry_id,
		business as name,
		address,
		emps as number_of_employees,
		geog::geography as geography,
		geog::geometry as geometry
	FROM infousa.businesses;

CREATE EXTENSION unaccent;
