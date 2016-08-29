-- Load FCC CMA boundaries (public)
-- This will only Load Missing Service Areas
WITH all_analysis_areas AS (
	SELECT
		l.id AS analysis_layer_id,
		c.gid,
		c.gid::varchar AS source_id
	FROM  ref_boundaries.cma c , client.analysis_layer l
	WHERE l.name='cma'
)
,
missing_analysis_areas AS (
	SELECT
		c.gid,
		c.analysis_layer_id
	FROM all_analysis_areas c
	LEFT JOIN client.analysis_area sa
		ON sa.source_id = c.source_id
		AND sa.analysis_layer_id = c.analysis_layer_id
	WHERE sa.id IS NULL
)
INSERT INTO client.analysis_area (analysis_layer_id, source_id, code, geog, geom, edge_buffer, location_edge_buffer)
	SELECT
		m.analysis_layer_id,
		c.gid::varchar,
		c.name,
		Geography(ST_Force_2D(the_geom)) as geog,
		ST_Force_2D(the_geom) AS geom, -- Use ST_FORce_2D because the source shapefiles have geometry type MultiLineStringZ...
		ST_Transform(ST_buffer(ST_Convexhull(the_geom)::Geography, 200)::Geometry, 4326),
		ST_Transform(ST_buffer(ST_Convexhull(the_geom)::Geography, 50)::Geometry, 4326)  
	FROM missing_analysis_areas m
	JOIN ref_boundaries.cma c 
		ON m.gid = c.gid;