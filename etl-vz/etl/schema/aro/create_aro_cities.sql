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

CREATE INDEX aro_cities_geom_gist
  ON aro.cities USING gist (geom);

CREATE INDEX aro_cities_buffer_geog_gist
  ON aro.cities USING gist (buffer_geog);