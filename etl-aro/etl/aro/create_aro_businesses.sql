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

INSERT INTO aro.businesses(location_id, industry_id, name, address, number_of_employees, geog, geom)
	SELECT
		l.id AS location_id,
		b.sic4 AS industry_id,
		b.business AS name,
		b.address AS address,
		b.emps AS number_of_employees,
		b.geog AS geog,
		b.geog::geometry AS geom
	FROM infousa.businesses b
	JOIN aro.locations l
		ON ST_Equals(l.geom, b.geog::geometry)
	JOIN aro.wirecenters wc
		ON ST_Within(b.geog::geometry, wc.geom)
  WHERE
  	wc.wirecenter = 'NYCMNY79'
  	OR
  	wc.wirecenter = 'BFLONYEL'
  	OR
  	wc.wirecenter = 'ORPKNYST';

CREATE INDEX aro_businesses_location_index ON aro.businesses(location_id);
CREATE INDEX aro_businesses_industry_index ON aro.businesses(industry_id);
CREATE INDEX aro_businesses_geog_index ON aro.businesses USING gist(geog);
CREATE INDEX aro_businesses_geom_index ON aro.businesses USING gist(geom);

CREATE EXTENSION unaccent;
