-- Table: aro.locations

DROP TABLE IF EXISTS aro.locations;

CREATE TABLE aro.locations
(
    id serial,
    address varchar,
    building_id varchar,
    city varchar,
    country varchar,
    postal_code varchar,
    lat double precision,
    lon double precision,
    geog geography(POINT, 4326),
    wirecenter_id varchar,
    CONSTRAINT aro_locations_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'locations', 'geom', 4326, 'POINT', 2);

-- Load unique locations from colt source locations table
-- There is some question as to which field we should be selecting distinct on to get nonduplicate locations...
-- We will also remove some values which have 0, 0 for lat,lon
WITH inbounds_locs AS
(
    SELECT * FROM source_colt.locations 
    WHERE ad_longitude >= 1.0 -- This is not a universal filter. Locations in the Colt dataset should not have longitudes less than 1, or they end up outside cities where there is coverage.
)
INSERT INTO aro.locations(building_id, address, city, country, postal_code, lat, lon, geog, geom)
    SELECT DISTINCT ON (bm_building_id)
        bm_building_id AS building_id,
        (ad_house_number || ' ' || ad_street_name)::text AS address,
        ad_cityname_english,
        ad_country_name,
        ad_postal_code,
        ad_latitude,
        ad_longitude,
        ST_SetSRID(ST_Point(ad_longitude, ad_latitude),4326)::geography as geog,
        ST_SetSRID(ST_Point(ad_longitude, ad_latitude),4326) as geom
    FROM inbounds_locs
    WHERE ad_longitude != 0 AND ad_latitude != 0
    AND ad_longitude != ad_latitude;

CREATE INDEX aro_locations_geog_gist
  ON aro.locations USING gist (geog);

CREATE INDEX aro_locations_geom_gist
  ON aro.locations USING gist (geom);

VACUUM ANALYZE aro.locations;
