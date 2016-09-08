-- Table: aro.locations

DROP TABLE IF EXISTS aro.locations CASCADE;

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

CREATE INDEX aro_locations_geog_gist
  ON aro.locations
  USING gist
  (geog);

CREATE INDEX aro_locations_geom_gist
  ON aro.locations
  USING gist
  (geom);

CREATE INDEX aro_locations ON aro.locations using gist (geog);

CREATE INDEX locations_total_businesses_index ON locations(total_businesses);

CREATE INDEX locations_total_households_index ON locations(total_households);

CREATE INDEX locations_total_towers_index ON locations(total_towers);

DO $$
DECLARE
    all_states text[][] := array[['NY', '36'], ['WA', '53']];
    state text[];
    current_table text;

BEGIN
    -- Loop for creating partitioned subtables
    FOREACH state SLICE 1 IN ARRAY all_states
    LOOP

        RAISE NOTICE '*************************';
        RAISE NOTICE '*** CURRENT STATE: %', state[1];

        current_table := 'aro_data.locations_' || lower(state[1]);
        
        RAISE NOTICE '**** CREATING TABLE ****';
        EXECUTE 'CREATE TABLE ' || current_table || ' (CHECK (state = ''' || state[1] || '''), CONSTRAINT aro_locations_' || state[1] || '_pkey PRIMARY KEY (id)) INHERITS (aro.locations);';

        RAISE NOTICE '**** BUILDING INDEXES ****';
        EXECUTE 'CREATE INDEX aro_locations_' || state[1] || '_geom_gist ON ' || current_table || ' USING gist (geom);';
        EXECUTE 'CREATE INDEX aro_locations_' || state[1] || '_geog_gist ON ' || current_table || ' USING gist (geog);';
        EXECUTE 'CREATE INDEX aro_locations_' || state[1] || '_total_businesses_index ON ' || current_table || '(total_businesses);';
        EXECUTE 'CREATE INDEX aro_locations_' || state[1] || '_total_households_index ON ' || current_table || '(total_households);';
        EXECUTE 'CREATE INDEX aro_locations_' || state[1] || '_total_towers_index ON ' || current_table || '(total_towers);';
    END LOOP;
END$$;