DROP TABLE IF EXISTS aro.wirecenters;

-- Create the existing fiber plant table fOR display on the ARO map and fOR eventual incORpORation into the ARO graph.
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
SELECT AddGeometryColumn('aro', 'wirecenters', 'edge_buffer', 4326, 'GEOMETRY', 2);
SELECT AddGeometryColumn('aro', 'wirecenters', 'location_edge_buffer', 4326, 'GEOMETRY', 2);

CREATE INDEX aro_wirecenters_geom_gist ON aro.wirecenters USING gist (geom);
CREATE INDEX aro_wirecenters_geog_gist ON aro.wirecenters USING gist (geog);
CREATE INDEX aro_wirecenters_edge_buffer ON aro.wirecenters USING gist (edge_buffer);
CREATE INDEX aro_wirecenters_location_edge_buffer ON aro.wirecenters USING gist (location_edge_buffer);


-- -- Load VZ CRAN boundaries as wirecenters
-- INSERT INTO aro.wirecenters (gid, wirecenter, geog, geom, edge_buffer, location_edge_buffer)
-- 	SELECT
-- 		gid,
-- 		name,
-- 		Geography(ST_FORce_2D(the_geom)) as geog, -- Use ST_FORce_2D because the source shapefiles have geometry type MultiLineStringZ...
-- 		ST_FORce_2D(the_geom) AS geom, -- Use ST_FORce_2D because the source shapefiles have geometry type MultiLineStringZ...
-- 		ST_TransfORm(ST_buffer(ST_Convexhull(the_geom)::Geography, 200)::Geometry, 4326),
-- 		ST_TransfORm(ST_buffer(ST_Convexhull(the_geom)::Geography, 50)::Geometry, 4326) 
-- 	FROM r;

-- -- Use this view to filter if we have a large number of wirecenters but only want to load other geo data for a subset.
-- -- The logic in this can obviously be changed as needed
-- DROP VIEW IF EXISTS aro.wirecenter_subset;


