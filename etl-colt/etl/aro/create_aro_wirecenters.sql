DROP TABLE IF EXISTS aro.wirecenters;

-- Create the existing fiber plant table for display on the ARO map and for eventual incorporation into the ARO graph.
CREATE TABLE aro.wirecenters
(
	id serial,
	gid bigint,
	state varchar,
	wirecenter varchar,
	aocn varchar,
	aocn_name varchar,
	geog geography('MULTIPOLYGON', 4326),
	CONSTRAINT aro_wirecenters_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'wirecenters', 'geom', 4326, 'MULTIPOLYGON', 2);

CREATE INDEX aro_wirecenters_geom_gist ON aro.wirecenters USING gist (geom);
CREATE INDEX aro_wirecenters_geog_gist ON aro.wirecenters USING gist (geog);

-- Load the data we need from geotel.wirecenters into aro.wirecenters 
-- We'll preserve all carriers' fiber plant in the aro.wirecenters table, but only one set (the '"client's") will be added to the graph.
INSERT INTO aro.wirecenters (gid, state, wirecenter, aocn, aocn_name, geog, geom)
	SELECT
		gid,
		state,
		wirecenter,
		aocn,
		aocn_name,
		Geography(ST_Force_2D(the_geom)) as geog, -- Use ST_Force_2D because the source shapefiles have geometry type MultiLineStringZ...
		ST_Force_2D(the_geom) AS geom -- Use ST_Force_2D because the source shapefiles have geometry type MultiLineStringZ...
	FROM geotel.wirecenters;