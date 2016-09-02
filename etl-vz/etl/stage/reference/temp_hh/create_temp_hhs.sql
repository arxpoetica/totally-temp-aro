-- Create master table
DROP TABLE IF EXISTS temp_hh.households CASCADE;

CREATE TABLE temp_hh.households 
(
	id serial,
	address varchar,
	city varchar,
	state varchar,
	zip5 varchar,
	lat double precision,
	lon double precision,
	geog geography(POINT, 4326),
	CONSTRAINT temp_households_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('temp_hh', 'households', 'geom', 4326, 'POINT', 2);

CREATE INDEX temp_households_geom_gist ON temp_hh.households USING gist (geom);
CREATE INDEX temp_households_geog_gist ON temp_hh.households USING gist (geog);

-- Create children tables for each state
DO $$
DECLARE
    all_states text[][] := array[['NY', '36'], ['WA', '53']];
    state text[];

BEGIN
    -- Loop for creating partitioned subtables
    FOREACH state SLICE 1 IN ARRAY all_states
    LOOP

        RAISE NOTICE '*************************';
        RAISE NOTICE '*** CURRENT STATE: %', state[1];

        current_table := 'temp_hh_data.households_' || lower(state[1]);
        
        RAISE NOTICE '**** CREATING TABLE ****';
        EXECUTE 'CREATE TABLE ' || current_table || ' (CHECK (state = ''' || state[1] || '''), CONSTRAINT temp_households_' || lower(state[1]) || '_pkey PRIMARY KEY (id)) INHERITS (temp_hh.households);';

        RAISE NOTICE '**** INDEXING GEOMETRY ****';
        EXECUTE 'CREATE INDEX temp_households_' || lower(state[1]) || '_geom_gist ON temp_hh_data.households_' || lower(state[1]) || ' USING gist (geom);';

        RAISE NOTICE '**** INDEXING GEOGRAPHY ****';
        EXECUTE 'CREATE INDEX temp_households_' || lower(state[1]) || '_geog_gist ON temp_hh_data.households_' || lower(state[1]) || ' USING gist (geog);';

    END LOOP;
END$$;
