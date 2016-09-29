TRUNCATE TABLE project_constraints.spatial ;
WITH all_areas AS (
	SELECT ST_MakeValid(ST_Transform(the_geom, 4326)) AS geom
	FROM boundaries.cran
)
,
combined_area AS (
	SELECT ST_Union(geom) as geom
	FROM all_areas
)
INSERT INTO project_constraints.spatial
	(native_geom, geom, geog)
SELECT
	 geom AS native_geom,
	 ST_Transform(geom, 4326) AS geom,
	 ST_Transform(geom, 4326)::geography AS geog
FROM combined_area ;