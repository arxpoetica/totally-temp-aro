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

    total_businesses integer NOT NULL DEFAULT 0,
    total_households integer NOT NULL DEFAULT 0,
    total_towers integer NOT NULL DEFAULT 0,

    CONSTRAINT aro_locations_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'locations', 'geom', 4326, 'POINT', 2);

-- SELECT setval('aro.locations_id_seq', COALESCE((SELECT MAX(id)+1 FROM locations), 1));


CREATE INDEX aro_locations_geog_gist
  ON aro.locations
  USING gist
  (geog);

CREATE INDEX aro_locations_geom_gist
  ON aro.locations
  USING gist
  (geom);


create index aro_locations on aro.locations using gist (geog);

CREATE INDEX locations_total_businesses_index ON locations(total_businesses);

CREATE INDEX locations_total_households_index ON locations(total_households);

CREATE INDEX locations_total_towers_index ON locations(total_towers);
