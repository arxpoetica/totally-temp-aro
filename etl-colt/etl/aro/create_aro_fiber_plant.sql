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

-- Load data from each of the source_colt fiber tables.
-- Because each table only contains a single MULTILINESTRINGZM record, we must first dump the collection to return each individual LINESTRING.
-- Then we force2d to get rid of the ZM values
INSERT INTO aro.fiber_plant (carrier_name, carrier_id, cbsa, plant_type, geog, geom, buffer_geom)
	SELECT
		'Colt'::text,
		(select carriers.id from aro.carriers carriers where carriers.name = 'Colt' limit 1)::int,
		'Paris'::text,
		'fiber_route_segment'::text,
  		Geography(ST_Force_2d(simple.simple_geom)) AS geog,
  		ST_Force_2d(simple.simple_geom) AS geom,
  		ST_Buffer(simple.simple_geom::geography, 152.4)::geometry AS buffer_geom
	FROM (
	 	SELECT
	    	(dumped.geom_dump).geom as simple_geom
	  	FROM (
	    	SELECT ST_Dump(geom) AS geom_dump FROM source_colt.paris_fiber
	  	) as dumped
	) AS simple;

INSERT INTO aro.fiber_plant (carrier_name, carrier_id, cbsa, plant_type, geog, geom, buffer_geom)
	SELECT
		'Colt'::text,
		(select carriers.id from aro.carriers carriers where carriers.name = 'Colt' limit 1)::int,
		'Frankfurt'::text,
		'fiber_route_segment'::text,
  		Geography(ST_Force_2d(simple.simple_geom)) AS geog,
  		ST_Force_2d(simple.simple_geom) AS geom,
  		ST_Buffer(simple.simple_geom::geography, 152.4)::geometry AS buffer_geom
	FROM (
	 	SELECT
	    	(dumped.geom_dump).geom as simple_geom
	  	FROM (
	    	SELECT ST_Dump(geom) AS geom_dump FROM source_colt.frankfurt_fiber
	  	) as dumped
	) AS simple;

-- Load Interroute
INSERT INTO aro.fiber_plant (carrier_name, carrier_id, cbsa, plant_type, geog, geom, buffer_geom)
	SELECT
		'Interroute'::text,
		(select carriers.id from aro.carriers carriers where carriers.name = 'Interroute' limit 1)::int,
		'Frankfurt'::text,
		'fiber_route_segment'::text,
  		Geography(ST_Force_2d(simple.simple_geom)) AS geog,
  		ST_Force_2d(simple.simple_geom) AS geom,
  		ST_Buffer(simple.simple_geom::geography, 152.4)::geometry AS buffer_geom
	FROM (
	 	SELECT
	    	(dumped.geom_dump).geom as simple_geom
	  	FROM (
	    	SELECT ST_Dump(geom) AS geom_dump FROM source_colt.competitor_fiber_interroute_frankfurt
	  	) as dumped
	) AS simple;

INSERT INTO aro.fiber_plant (carrier_name, carrier_id, cbsa, plant_type, geog, geom, buffer_geom)
	SELECT
		'Level 3'::text,
		(select carriers.id from aro.carriers carriers where carriers.name = 'Level 3' limit 1)::int,
		'Frankfurt'::text,
		'fiber_route_segment'::text,
  		Geography(ST_Force_2d(simple.simple_geom)) AS geog,
  		ST_Force_2d(simple.simple_geom) AS geom,
  		ST_Buffer(simple.simple_geom::geography, 152.4)::geometry AS buffer_geom
	FROM (
	 	SELECT
	    	(dumped.geom_dump).geom as simple_geom
	  	FROM (
	    	SELECT ST_Dump(geom) AS geom_dump FROM source_colt.competitor_fiber_level3_frankfurt
	  	) as dumped
	) AS simple;

CREATE INDEX aro_fiber_plant_carrier_index ON aro.fiber_plant(carrier_id);
CREATE INDEX aro_fiber_plant_geom_gist ON aro.fiber_plant USING gist (geom);
CREATE INDEX aro_fiber_plant_buffer_geom_gist ON aro.fiber_plant USING gist (buffer_geom);
CREATE INDEX aro_fiber_plant_geog_gist ON aro.fiber_plant USING gist (geog);

	