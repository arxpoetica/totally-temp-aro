-- Table: public.aro_locations

-- DROP TABLE public.aro_locations;

CREATE TABLE public.aro_locations
(
	id bigint,
	address varchar,
	city varchar,
	state varchar(2),
	zipcode varchar,
	entry_fee numeric,
	lat double precision,
	lon double precision,
	CONSTRAINT aro_locations_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('public', 'aro_locations', 'geom', 4326, 'POINT', 2);

CREATE INDEX aro_locations_geom_gist
  ON public.aro_locations
  USING gist
  (geom);

ALTER TABLE public.aro_locations
  OWNER TO postgres;
GRANT ALL ON TABLE public.aro_locations TO aro;

-- Load locations from infousa_businesses
INSERT INTO aro_locations(id, address, city, state, zipcode, lat, lon, geog)
	SELECT DISTINCT ON (ST_AsText(geog))
		bldgid as id,
		address,
		city,
		state,
		zip AS zipcode,
		lat,
		long AS lon,
		ST_GeographyFromText(ST_AsText(geog)) AS geog
	FROM infousa_businesses
	GROUP BY id, address, city, state, zipcode, lat, lon, geog;



