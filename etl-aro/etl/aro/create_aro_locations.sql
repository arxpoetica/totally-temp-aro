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
        businesses.geog as geog,
        businesses.geog::geometry as geom

    FROM infousa.businesses;-- JOIN aro.wirecenters
      -- ON businesses.geog && wirecenters.geog
    --   ON ST_Within(businesses.geog::geometry, wirecenters.geom)
    -- WHERE
    --   -- NYC Upper East Side (URBAN)
    --   wirecenters.wirecenter = 'NYCMNY79'
    --   OR
    --   -- Buffalo, New York (URBAN)
    --   wirecenters.wirecenter = 'BFLONYEL'
    --   OR
    --   wirecenters.wirecenter = 'BFLONYFR'
    --   OR
    --   -- Orchard Park, NY (SUBURBAN)
    --   wirecenters.wirecenter = 'ORPKNYST'
    --   OR
    --   -- North Collins, NY (RURAL)
    --   wirecenters.wirecenter = 'NCLNNYNO';

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
