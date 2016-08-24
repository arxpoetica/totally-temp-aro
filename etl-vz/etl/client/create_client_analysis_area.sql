DROP TABLE IF EXISTS client.analysis_area;
CREATE TABLE client.analysis_area
(	
id serial PRIMARY KEY,
analysis_layer_id int4 not null references client.analysis_layer, 
source_id varchar(64),
state varchar(6),
code varchar(64),
geog geography('MULTIPOLYGON', 4326)
);

SELECT AddGeometryColumn('client', 'analysis_area', 'geom', 4326, 'MULTIPOLYGON', 2);
SELECT AddGeometryColumn('client', 'analysis_area', 'edge_buffer', 4326, 'GEOMETRY', 2);
SELECT AddGeometryColumn('client', 'analysis_area', 'location_edge_buffer', 4326, 'GEOMETRY', 2);


CREATE INDEX client_analysis_area_geom_gist ON client.analysis_area USING gist (geom);
CREATE INDEX client_analysis_area_geog_gist ON client.analysis_area USING gist (geog);
CREATE INDEX client_analysis_area_edge_buffer ON client.analysis_area USING gist (edge_buffer);
CREATE INDEX client_analysis_area_location_edge_buffer ON client.analysis_area USING gist (location_edge_buffer) ;

-- Load FCC CMA boundaries (public)
WITH cma_layer AS (
	SELECT * FROM client.analysis_layer WHERE name = 'cma'
)
INSERT INTO client.analysis_area (analysis_layer_id, source_id, code, geog, geom, edge_buffer, location_edge_buffer)
	SELECT
		l.id,
		c.gid::varchar,
		c.name,
		Geography(ST_Force_2D(the_geom)) as geog,
		ST_Force_2D(the_geom) AS geom, -- Use ST_FORce_2D because the source shapefiles have geometry type MultiLineStringZ...
		ST_Transform(ST_buffer(ST_Convexhull(the_geom)::Geography, 200)::Geometry, 4326),
		ST_Transform(ST_buffer(ST_Convexhull(the_geom)::Geography, 50)::Geometry, 4326)  
	FROM boundaries.cma c, cma_layer l;