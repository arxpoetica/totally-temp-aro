-- Table: aro.households
DROP TABLE IF EXISTS aro.households;

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

-- Match infousa.households to aro.locations using geography
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
		hh.geom
	FROM infousa.households hh
	JOIN aro.locations loc
		ON ST_Equals(loc.geom, hh.geom)
	JOIN aro.wirecenter_subset wc
  	ON ST_Within(hh.geom, wc.geom);

CREATE INDEX aro_temp_households_location_index ON aro.temp_households(location_id);
CREATE INDEX aro_temp_households_geog_index ON aro.temp_households USING gist(geog);
CREATE INDEX aro_temp_households_geom_index ON aro.temp_households USING gist(geom);


CREATE TABLE aro.households
(
	id SERIAL,
	location_id bigint REFERENCES aro.locations,
	number_of_households int CHECK (number_of_households >= 0),
	CONSTRAINT aro_household_summary_pkey PRIMARY KEY (id)
);

CREATE INDEX aro_households_location_index ON aro.households(location_id);

-- Assign the count of InfoGroup households to a location
INSERT INTO aro.households (location_id, number_of_households)
	SELECT
		l.id AS location_id,
		COUNT(hh.location_id) AS hh_count
	FROM aro.temp_households hh
	JOIN aro.locations l 
		ON l.id = hh.location_id
	GROUP BY l.id;

-- Drop the reference table - not needed anymore
DROP TABLE aro.temp_households;
