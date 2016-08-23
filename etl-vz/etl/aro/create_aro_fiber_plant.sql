-- Table: aro.fiber_plant

DROP TABLE IF EXISTS aro.fiber_plant;

-- Create the existing fiber plant table for display on the ARO map and for eventual incorporation into the ARO graph.
CREATE TABLE aro.fiber_plant
(
	id serial,
	gid bigint,
	carrier_name varchar,
	carrier_id int,
	cbsa varchar,
	state varchar(2),
	plant_type varchar,
	zipcode varchar,
	geog geography('LINESTRING', 4326),
	CONSTRAINT aro_fiber_plant_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'fiber_plant', 'geom', 4326, 'LINESTRING', 2);
-- Create a buffer for use in determining service availability
SELECT AddGeometryColumn('aro', 'fiber_plant', 'buffer_geom', 4326, 'GEOMETRY', 2);

CREATE INDEX aro_fiber_plant_geom_gist ON aro.fiber_plant USING gist (geom);
CREATE INDEX aro_fiber_plant_geog_gist ON aro.fiber_plant USING gist (geog);
CREATE INDEX aro_fiber_plant_carrier_index ON aro.fiber_plant(carrier_id);
CREATE INDEX aro_fiber_plant_buffer_geom_gist ON aro.fiber_plant USING gist (buffer_geom);


-- Load the data we need from geotel.fiber_plant into aro.fiber_plant
-- We'll preserve all carriers' fiber plant in the aro.fiber_plant table, but only one set (the '"client's") will be added to the graph.
INSERT INTO aro.fiber_plant (gid, carrier_name, cbsa, state, plant_type, zipcode, geog, geom)
	SELECT
		gid,
		carrier AS carrier_name,
		cbsa,
		state,
		type AS plant_type,
		zip AS zipcode,
		Geography(ST_GeometryN(ST_Force_2D(the_geom),1)) as geog, -- Use ST_Force_2D because the source shapefiles have geometry type MultiLineStringZ...
		ST_GeometryN(ST_Force_2D(the_geom),1) AS geom -- Use ST_Force_2D because the source shapefiles have geometry type MultiLineStringZ...
	FROM geotel.fiber_plant;

UPDATE aro.fiber_plant SET buffer_geom=ST_Buffer(geog, 152.4)::geometry;

UPDATE aro.fiber_plant SET carrier_id=(SELECT id FROM aro.carriers WHERE carriers.name=fiber_plant.carrier_name);
