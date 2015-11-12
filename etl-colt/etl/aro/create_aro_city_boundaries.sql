DROP TABLE IF EXISTS aro.city_boundaries;

CREATE TABLE aro.city_boundaries 
(
	id serial,
	city_name varchar,
	CONSTRAINT aro_city_boundaries_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'city_boundaries', 'geom', 4326, 'POLYGON', 2);

-- Create a bounding hull for Paris based on aro.locations in France
INSERT INTO aro.city_boundaries(city_name, geom)
	SELECT 
		'Paris'::text AS city_name,
		ST_ConvexHull(ST_Collect(geom)) AS geom
	FROM aro.locations
	WHERE geom IS NOT NULL
	AND country = 'France';

-- Create a bounding hull for Frankfurt based on aro.locations in Germany
INSERT INTO aro.city_boundaries(city_name, geom)
	SELECT 
		'Frankfurt'::text AS city_name,
		ST_ConvexHull(ST_Collect(geom)) AS geom
	FROM aro.locations
	WHERE geom IS NOT NULL
	AND country = 'Germany';

CREATE INDEX aro_city_boundaries_geom_gist
  ON aro.city_boundaries USING gist (geom);