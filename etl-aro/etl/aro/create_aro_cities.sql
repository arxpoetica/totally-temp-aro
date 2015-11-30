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

-- Create a bounding hull for New York based on aro.locations in NEW YORK
INSERT INTO aro.cities(city_name, country_name, geom, buffer_geog)
	SELECT
		'New York'::text AS city_name,
		'USA'::text AS country_name,
		ST_ConvexHull(ST_Collect(geom)) AS geom,
		ST_Buffer(ST_ConvexHull(ST_Collect(geom))::geography, 100) AS buffer_geog
	FROM aro.locations
	WHERE geom IS NOT NULL
	AND city = 'NEW YORK';

CREATE INDEX aro_cities_geom_gist
  ON aro.cities USING gist (geom);

CREATE INDEX aro_cities_buffer_geog_gist
  ON aro.cities USING gist (buffer_geog);
