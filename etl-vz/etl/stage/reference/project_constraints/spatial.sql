DROP TABLE IF EXISTS project_constraints.spatial;
CREATE TABLE project_constraints.spatial AS
SELECT
	 geom AS native_geom,
	 ST_Transform(geom, 4326) AS geom,
	 ST_Transform(geom, 4326)::geography AS geog
FROM (
	SELECT ST_ConvexHull(ST_Union(the_geom)) as geom
	FROM geotel.wirecenters
) AS sp ;

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