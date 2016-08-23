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
    dn_largest_business_category varchar,
    dn_largest_household_category varchar,
    CONSTRAINT aro_locations_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'locations', 'geom', 4326, 'POINT', 2);

-- SELECT setval('aro.locations_id_seq', COALESCE((SELECT MAX(id)+1 FROM locations), 1));

-- Make locations out of VZ Customers
INSERT INTO aro.locations(address, lat, lon, geom, geog)
    SELECT DISTINCT ON (lat, long)
        prism_formatted_address,
        lat,
        long,
        ST_SetSRID(ST_MakePoint(long, lat), 4326) AS geom,
        ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography AS geog
    FROM businesses.vz_customers b
    JOIN aro.wirecenter_subset wc
        ON ST_Within(ST_SetSRID(ST_MakePoint(b.long, b.lat), 4326), wc.geom);

-- Make locations out of TAMs
INSERT INTO aro.locations(address, lat, lon, geom, geog)
    SELECT DISTINCT ON (arcgis_latitude, arcgis_longitude)
        b.street_addr,
        b.arcgis_latitude,
        b.arcgis_longitude,
        ST_SetSRID(ST_MakePoint(b.arcgis_longitude, b.arcgis_latitude), 4326) AS geom,
        ST_SetSRID(ST_MakePoint(b.arcgis_longitude, b.arcgis_latitude), 4326)::geography AS geog
    FROM businesses.tam b
    JOIN aro.wirecenter_subset wc
        ON ST_Within(ST_SetSRID(ST_MakePoint(b.arcgis_longitude, b.arcgis_latitude), 4326), wc.geom)
    WHERE 
    b.arcgis_latitude != 0 
    AND b.arcgis_longitude != 0;

-- Make locations out of InfoGroup households (temp_hh.households)
INSERT INTO aro.locations(address, city, state, zipcode, lat, lon, geom, geog)
    SELECT DISTINCT ON (lat, lon)
        hh.address,
        hh.city,
        hh.state,
        hh.zip5,
        hh.lat,
        hh.lon,
        hh.geom,
        hh.geog
    FROM temp_hh.households hh
    JOIN aro.wirecenter_subset wc
        ON ST_Within(hh.geom, wc.geom);

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
