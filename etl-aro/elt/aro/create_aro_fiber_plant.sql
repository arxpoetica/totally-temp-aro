-- Table: aro.fiber_plant

DROP TABLE IF EXISTS aro.fiber_plant;

-- Create the existing fiber plant table for display on the ARO map and for eventual incorporation into the ARO graph.
CREATE TABLE aro.fiber_plant
(
	id serial,
	gid bigint,
	carrier_name varchar,
	cbsa varchar,
	state varchar(2),
	plant_type varchar,
	zipcode varchar,
	geog geography('LINESTRING', 4326),
	CONSTRAINT aro_fiber_plant_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'fiber_plant', 'geom', 4326, 'LINESTRING', 2);

CREATE INDEX aro_fiber_plant_geom_gist ON aro.fiber_plant USING gist (geom);
CREATE INDEX aro_fiber_plant_geog_gist ON aro.fiber_plant USING gist (geog);

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