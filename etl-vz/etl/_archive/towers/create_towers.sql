DROP TABLE IF EXISTS towers.towers;

CREATE TABLE towers.towers 
(
	id serial,
	city varchar,
	lat double precision,
	lon double precision,
	geog geography(POINT, 4326),
	CONSTRAINT towers_towers_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('towers', 'towers', 'geom', 4326, 'POINT', 2);

-- -- Load SITA towers
-- INSERT INTO towers.towers(city, lat, lon, geog, geom)
-- 	SELECT
-- 		parcel_city,
-- 		latitude,
-- 		longitude,
-- 		ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography AS geog,
-- 		ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) AS geom
-- 	FROM towers.sita_towers;

-- Load WA towers
INSERT INTO towers.towers(city, lat, lon, geog, geom)
	SELECT
		city,
		lat,
		lon,
		ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography AS geog,
		ST_SetSRID(ST_MakePoint(lon, lat), 4326) AS geom
	FROM towers.vz_wa_towers;

-- Load OH towers
INSERT INTO towers.towers(city, lat, lon, geog, geom)
	SELECT
		city,
		lat,
		lon,
		ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography AS geog,
		ST_SetSRID(ST_MakePoint(lon, lat), 4326) AS geom
	FROM towers.vz_oh_towers;

-- Load MO towers
INSERT INTO towers.towers(city, lat, lon, geog, geom)
	SELECT
		city,
		lat,
		long,
		ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography AS geog,
		ST_SetSRID(ST_MakePoint(long, lat), 4326) AS geom
	FROM towers.vz_mo_towers;
