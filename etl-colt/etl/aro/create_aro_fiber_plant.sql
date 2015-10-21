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

-- Load data from each of the source_colt fiber tables.
-- Because each table only contains a single MULTILINESTRINGZM record, we must first dump the collection to return each individual LINESTRING.
-- Then we force2d to get rid of the ZM values
INSERT INTO aro.fiber_plant (carrier_name, cbsa, plant_type, geog, geom)
	SELECT
		'Colt'::text,
		'Paris'::text,
		'fiber_route_segment'::text,
  		Geography(ST_Force_2d(simple.simple_geom)) AS geog,
  		ST_Force_2d(simple.simple_geom) AS geom
	FROM (
	 	SELECT
	    	(dumped.geom_dump).geom as simple_geom
	  	FROM (
	    	SELECT ST_Dump(geom) AS geom_dump FROM source_colt.paris_fiber
	  	) as dumped
	) AS simple;

INSERT INTO aro.fiber_plant (carrier_name, cbsa, plant_type, geog, geom)
	SELECT
		'Colt'::text,
		'Frankfurt'::text,
		'fiber_route_segment'::text,
  		Geography(ST_Force_2d(simple.simple_geom)) AS geog,
  		ST_Force_2d(simple.simple_geom) AS geom
	FROM (
	 	SELECT
	    	(dumped.geom_dump).geom as simple_geom
	  	FROM (
	    	SELECT ST_Dump(geom) AS geom_dump FROM source_colt.frankfurt_fiber
	  	) as dumped
	) AS simple;





	