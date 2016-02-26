DROP TABLE IF EXISTS aro.towers;

CREATE TABLE aro.towers
(
	id serial,
	sita_number bigint,
	parcel_address varchar,
	parcel_city varchar,
	parcel_state varchar,
	lat double precision,
	lon double precision,
	geog geography(POINT, 4326),
	CONSTRAINT aro_towers_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'towers', 'geom', 4326, 'POINT', 2);

INSERT INTO aro.towers (sita_number, parcel_address, parcel_city, parcel_state, lat, lon, geog, geom)
	SELECT
		sita_number::bigint,
		parcel_address,
		parcel_city,
		parcel_state,
		latitude AS lat,
		longitude AS lon,
		ST_SetSRID(ST_Point(longitude, latitude),4326)::geography as geog,
    ST_SetSRID(ST_Point(longitude, latitude),4326) as geom
  FROM sita.towers 
  WHERE sita_number !~ '[^0-9]'
  AND (latitude != 0 AND longitude != 0)
  AND latitude != longitude
  AND parcel_state = 'NY'; -- Only do NY state for now, since all the other dev data is there.

CREATE INDEX aro_towers_geog_gist
  ON aro.towers USING gist (geog);

CREATE INDEX aro_towers_geom_gist
  ON aro.towers USING gist (geom);