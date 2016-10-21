DROP TABLE IF EXISTS aro.temp_households CASCADE;

CREATE TABLE aro.temp_households
(
	id serial,
	location_id bigint,
	source_id varchar,
	address varchar,
	city varchar,
	state varchar,
	zipcode varchar,
	lat double precision,
	lon double precision,
	geog geography(POINT, 4326),
	CONSTRAINT aro_temp_households_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'temp_households', 'geom', 4326, 'POINT', 2);

-- Match temp_hh.households to aro.locations using geography

CREATE INDEX aro_temp_households_location_index ON aro.temp_households(location_id);
CREATE INDEX aro_temp_households_geog_index ON aro.temp_households USING gist(geog);
CREATE INDEX aro_temp_households_geom_index ON aro.temp_households USING gist(geom);