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

-- Load WI towers
INSERT INTO towers.towers(lat, lon, geog, geom)
	SELECT
		lat,
		long,
		ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography AS geog,
		ST_SetSRID(ST_MakePoint(long, lat), 4326) AS geom
	FROM towers.vz_wi_towers;
