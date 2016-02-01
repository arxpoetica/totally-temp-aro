DROP TABLE IF EXISTS aro.verizon_locations;

CREATE TABLE aro.verizon_locations
(
    id serial,
    address varchar,
    city varchar,
    country varchar,
    postal_code varchar,
    verizon_nodename varchar,
    provider varchar,
    lat double precision,
    lon double precision,
    geog geography(POINT, 4326),
    CONSTRAINT pkey_aro_verizon_buildings_id PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'verizon_locations', 'geom', 4326, 'POINT', 2);

INSERT INTO aro.verizon_locations(address, city, country, postal_code, verizon_nodename, provider, lat, lon, geog, geom)
    SELECT
        address,
        city,
        'France'::text AS country,
        postcode AS postal_code,
        verizon_nodename,
        provider,
        lat,
        lon,
        ST_SetSRID(ST_Point(lon, lat),4326)::geography as geog,
        ST_SetSRID(ST_Point(lon, lat),4326) as geom
    FROM source_colt.verizon_buildings
    WHERE lon != 0 AND lat != 0
    AND lon != lat;

CREATE INDEX aro_verizon_locations_geog_gist
  ON aro.verizon_locations USING gist (geog);

CREATE INDEX aro_verizon_locations_geom_gist
  ON aro.verizon_locations USING gist (geom);

VACUUM ANALYZE aro.verizon_locations;