-- Table: aro.locations

DROP TABLE aro.locations;

CREATE TABLE aro.locations
(
    id serial,
    address varchar,
    city varchar,
    state varchar(2),
    zipcode varchar,
    entry_fee numeric,
    lat double precision,
    lon double precision,
    geog geography(POINT, 4326),
    wirecenter_id varchar,
    CONSTRAINT aro_locations_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'locations', 'geom', 4326, 'POINT', 2);

-- Load locations from infousa_businesses
-- ONLY using UES wirecenter for Verizon
INSERT INTO aro.locations(id, address, city, state, zipcode, lat, lon, geog, geom)
    SELECT DISTINCT ON (bldgid)
        bldgid as id,
        address,
        city,
        businesses.state,
        zip AS zipcode,
        lat,
        long AS lon,
        --ST_GeographyFromText(ST_AsText(businesses.geog)) AS geog,
        --ST_GeographyFromText(ST_AsText(businesses.geog))::geometry as geom
        businesses.geog as geog,
        businesses.geog::geometry as geom

    FROM infousa.businesses JOIN aro.wirecenters
      -- ON businesses.geog && wirecenters.geog
      ON ST_Within(businesses.geog::geometry, wirecenters.geom)
    WHERE 
      wirecenters.wirecenter = 'NYCMNY79';

CREATE INDEX aro_locations_geog_gist
  ON aro.locations
  USING gist
  (geog);

CREATE INDEX aro_locations_geom_gist
  ON aro.locations
  USING gist
  (geom);

VACUUM ANALYZE aro.locations;

