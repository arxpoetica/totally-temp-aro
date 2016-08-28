-- Truncate arocities
TRUNCATE aro.cities CASCADE;
-- Create a bounding hull for New York based on aro.locations in NEW YORK
--Insert cities
INSERT INTO aro.cities(city_name, country_name, geom, buffer_geog, centroid)
	SELECT
		'New York'::text AS city_name,
		'USA'::text AS country_name,
		ST_ConvexHull(ST_Collect(geom)) AS geom,
		ST_Buffer(ST_ConvexHull(ST_Collect(geom))::geography, 100) AS buffer_geog,
		ST_SetSRID(ST_Point(-74.0059413, 40.7127837), 4326) AS centroid
	FROM aro.locations
	WHERE geom IS NOT NULL
	AND city = 'NEW YORK';