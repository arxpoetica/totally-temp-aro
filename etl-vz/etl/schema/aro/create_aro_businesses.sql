-- Table: aro.businesses

DROP TABLE IF EXISTS aro.businesses CASCADE;

CREATE TABLE aro.businesses
(
	id serial,
	location_id bigint,
	industry_id int,
	name varchar,
	address varchar,
	state varchar,
	number_of_employees integer,
	annual_recurring_cost numeric,
	monthly_recurring_cost numeric,
	source varchar,
	source_id varchar,
	geog geography (POINT, 4326),
	geom geometry (POINT, 4326),
	CONSTRAINT aro_businesses_pkey PRIMARY KEY (id)
);

CREATE INDEX aro_businesses_location_index ON aro.businesses(location_id);
CREATE INDEX aro_businesses_industry_index ON aro.businesses(industry_id);
CREATE INDEX aro_businesses_geog_index ON aro.businesses USING gist(geog);
CREATE INDEX aro_businesses_geom_index ON aro.businesses USING gist(geom);
CREATE INDEX aro_businesses_name ON aro.businesses USING GIN (to_tsvector('english', name));

CREATE EXTENSION unaccent;