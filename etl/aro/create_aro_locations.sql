-- Table: aro.locations

-- DROP TABLE aro.locations;

CREATE TABLE aro.locations
(
	id bigint,
	address varchar,
	city varchar,
	state varchar(2),
	zipcode varchar,
	entry_fee numeric,
	lat double precision,
	lon double precision,
	geog geography(POINT, 4326),
	CONSTRAINT aro_locations_pkey PRIMARY KEY (id)
);

CREATE INDEX aro_locations_geom_gist
  ON aro.locations
  USING gist
  (geog);


-- Load locations from infousa_businesses
INSERT INTO aro.locations(id, address, city, state, zipcode, lat, lon, geog)
	SELECT DISTINCT ON (ST_AsText(geog))
		bldgid as id,
		address,
		city,
		state,
		zip AS zipcode,
		lat,
		long AS lon,
		ST_GeographyFromText(ST_AsText(geog)) AS geog
	FROM infousa.businesses
	GROUP BY id, address, city, state, zipcode, lat, lon, geog;



