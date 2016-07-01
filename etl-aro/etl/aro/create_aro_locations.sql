-- Table: aro.locations

DROP TABLE IF EXISTS aro.locations;

CREATE TABLE aro.locations
(
    id serial,
    address varchar,
    city varchar,
    state varchar(2),
    zipcode varchar,
    lat double precision,
    lon double precision,
    geog geography(POINT, 4326),
    wirecenter_id varchar,
    CONSTRAINT aro_locations_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'locations', 'geom', 4326, 'POINT', 2);

-- SELECT setval('aro.locations_id_seq', COALESCE((SELECT MAX(id)+1 FROM locations), 1));

-- Make locations out of InfoUSA businesses (infousa.businesses)
-- ONLY using UES wirecenter for Verizon
INSERT INTO aro.locations(address, city, state, zipcode, lat, lon, geog, geom)
    SELECT DISTINCT ON (bldgid)
        address,
        city,
        businesses.state,
        zip AS zipcode,
        lat,
        long AS lon,
        businesses.geog as geog,
        businesses.geog::geometry as geom
    FROM infousa.businesses;

-- Make locations out of InfoGroup households (temp_hh.households)
INSERT INTO aro.locations(address, city, state, zipcode, lat, lon, geom, geog)
    SELECT DISTINCT ST_AsText(hh.geog)
        address,
        city,
        hh.state,
        zip5 AS zipcode,
        lat,
        lon,
        hh.geog::geometry as geom,
        hh.geog
    FROM temp_hh.households hh
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


CREATE INDEX aro_locations_geog_gist
  ON aro.locations
  USING gist
  (geog);

CREATE INDEX aro_locations_geom_gist
  ON aro.locations
  USING gist
  (geom);

VACUUM ANALYZE aro.locations;

create index aro_locations on aro.locations using gist (geog);

ALTER TABLE locations ADD COLUMN total_businesses integer NOT NULL DEFAULT 0;

ALTER TABLE locations ADD COLUMN total_households integer NOT NULL DEFAULT 0;

ALTER TABLE locations ADD COLUMN total_towers integer NOT NULL DEFAULT 0;

CREATE INDEX locations_total_businesses_index ON locations(total_businesses);

CREATE INDEX locations_total_households_index ON locations(total_households);

CREATE INDEX locations_total_towers_index ON locations(total_towers);
