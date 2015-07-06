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

SELECT AddGeometryColumn('aro', 'locations', 'geom', 4326, 'POINT', 2);

-- Load locations from infousa_businesses
-- ONLY using King County for now
INSERT INTO aro.locations(id, address, city, state, zipcode, lat, lon, geog, geom)
    SELECT DISTINCT ON (ST_AsText(geog))
        bldgid as id,
        address,
        city,
        state,
        zip AS zipcode,
        lat,
        long AS lon,
        ST_GeographyFromText(ST_AsText(geog)) AS geog,
        ST_GeographyFromText(ST_AsText(geog))::geometry as geom

    FROM infousa.businesses JOIN aro.cousub
      ON ST_Within(ST_GeographyFromText(ST_AsText(businesses.geog))::geometry), cousub.geom)
    WHERE 
      cousub.countyfp = '033'
    GROUP BY id, address, city, state, zipcode, lat, lon, geog;

CREATE INDEX aro_locations_geog_gist
  ON aro.locations
  USING gist
  (geog);

CREATE INDEX aro_locations_geom_gist
  ON aro.locations
  USING gist
  (geom);

VACUUM ANALYZE aro.locations;

