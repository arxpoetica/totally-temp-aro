CREATE TABLE project_constraints.spatial AS
SELECT
	 geom AS native_geom,
	 ST_Transform(geom, 4326) AS geom,
	 ST_Transform(geom, 4326)::geography AS geog
FROM (
	SELECT ST_ConvexHull(ST_Union(the_geom)) as geom
	FROM geotel.wirecenters
) AS sp ;