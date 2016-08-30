TRUNCATE TABLE project_constraints.spatial ;
WITH all_areas AS (
	SELECT ST_MakeValid(ST_Transform(the_geom, 4326)) AS geom
	FROM geotel.wirecenters
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

-- -- We need to create a project table that only uses certain areas for VZ
-- -- VZ needs to load all locations within their CRAN and DF boundaries
-- CREATE TABLE project_constraints.spatial AS
-- SELECT
-- 	 geom AS native_geom,
-- 	 ST_Transform(geom, 4326) AS geom,
-- 	 ST_Transform(geom, 4326)::geography AS geog
-- FROM (
-- 	SELECT ST_ConvexHull(ST_Union(the_geom)) as geom
-- 	FROM boundaries.directional_facilities
-- ) AS sp ;