DROP TABLE IF EXISTS aro.cities;

CREATE TABLE aro.cities
(
	id serial,
	city_name varchar,
	country_name varchar,
	buffer_geog geography(POLYGON, 4326),
	CONSTRAINT aro_cities_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'cities', 'geom', 4326, 'POLYGON', 2);
SELECT AddGeometryColumn('aro', 'cities', 'centroid', 4326, 'POINT', 2);

-- Create a bounding hull for Paris based on aro.locations in France
INSERT INTO aro.cities(city_name, country_name, geom, buffer_geog, centroid)
	SELECT
		'Paris'::text AS city_name,
		'France'::text AS country_name,
		ST_ConvexHull(ST_Collect(geom)) AS geom,
		ST_Buffer(ST_ConvexHull(ST_Collect(geom))::geography, 100) AS buffer_geog,
		ST_SetSRID(ST_Point(2.3522219, 48.856614), 4326) AS centroid
	FROM aro.locations
	WHERE geom IS NOT NULL
	AND country = 'France';

-- Create a bounding hull for Frankfurt based on aro.locations in Germany
INSERT INTO aro.cities(city_name, country_name, geom, buffer_geog, centroid)
	SELECT
		'Frankfurt'::text AS city_name,
		'Germany'::text AS country_name,
		ST_ConvexHull(ST_Collect(geom)) AS geom,
		ST_Buffer(ST_ConvexHull(ST_Collect(geom))::geography, 100) AS buffer_geog,
		ST_SetSRID(ST_Point(8.6821267, 50.1109221), 4326) AS centroid
	FROM aro.locations
	WHERE geom IS NOT NULL
	AND country = 'Germany';

CREATE INDEX aro_cities_geom_gist
  ON aro.cities USING gist (geom);

CREATE INDEX aro_cities_buffer_geog_gist
  ON aro.cities USING gist (buffer_geog);
