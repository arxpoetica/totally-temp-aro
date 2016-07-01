DROP TABLE IF EXISTS aro.temp_households;

CREATE TABLE aro.temp_households
(
	id serial,
	location_id bigint,
	address varchar,
	city varchar,
	state varchar,
	zipcode varchar,
	lat double precision,
	lon double precision,
	geog geography(POINT, 4326),
	CONSTRAINT aro_temp_households_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'temp_households', 'geom', 4326, 'POINT', 2);

-- Match temp_hh.households to aro.locations using geography
-- Assign location_id of matching location to row on insert
INSERT INTO aro.temp_households (location_id, address, city, state, zipcode, lat, lon, geog, geom)
	SELECT
		loc.id,
		hh.address,
		hh.city,
		hh.state,
		hh.zip5 AS zipcode,
		hh.lat,
		hh.lon,
		hh.geog,
		hh.geog::geometry AS geom
	FROM temp_hh.households hh
	JOIN aro.locations loc
		ON ST_Equals(loc.geom, hh.geog::geometry)
	JOIN aro.wirecenters wc
  	ON ST_Within(hh.geog::geometry, wc.geom)
    WHERE
        wc.wirecenter = 'NYCMNY79'
        OR
        wc.wirecenter = 'SYRCNYGS'
        OR
        wc.wirecenter = 'SYRCNYSU'
        OR
        wc.wirecenter = 'SYRCNYJS'
        OR
        wc.wirecenter = 'SYRCNYSA'
        OR
        wc.wirecenter = 'ADCTNYXA'
        OR
        wc.wirecenter = 'LOWVNYXA'
        OR
        wc.wirecenter = 'BFLONYHE'
        OR
        wc.wirecenter = 'BFLONYMA'
        OR
        wc.wirecenter = 'BFLONYEL'
        OR
        wc.wirecenter = 'BFLONYBA'
        OR
        wc.wirecenter = 'BFLONYSP'
        OR
        wc.wirecenter = 'BFLONYFR';

CREATE INDEX aro_temp_households_location_index ON aro.temp_households(location_id);
CREATE INDEX aro_temp_households_geog_index ON aro.temp_households USING gist(geog);
CREATE INDEX aro_temp_households_geom_index ON aro.temp_households USING gist(geom);
