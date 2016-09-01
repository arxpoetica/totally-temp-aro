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

DO $$
DECLARE
    all_states text[][] := array[['NY', '36'], ['WA', '53']];
    state text[];
    expr text;
    expr_start timestamp;
    state_start timestamp;
    expr_result record;
    i_rows INTEGER;
    current_table text;
    current_source_table text;
    current_table_suffix text;
    current_table_as_text text;

BEGIN
    
    -- Loop for creating partitioned subtables
    FOREACH state SLICE 1 IN ARRAY all_states
    LOOP

        RAISE NOTICE '*************************';
        RAISE NOTICE '*** CURRENT STATE: %', state[1];

        current_table := 'temp_hh_data.households_' || lower(state[1]);
        state_start := timeofday()::timestamp;
        
        RAISE NOTICE '**** CREATING TABLE ****';
        expr := 'CREATE TABLE ' || current_table || ' (CHECK (state = ''' || state[1] || '''), CONSTRAINT temp_households_' || lower(state[1]) || '_pkey PRIMARY KEY (id)) INHERITS (temp_hh.households);';
        RAISE NOTICE 'Executing %', expr;
        EXECUTE expr;

        RAISE NOTICE '**** INDEXING GEOMETRY ****';
        expr := 'CREATE INDEX temp_households_' || lower(state[1]) || '_geom_gist ON temp_hh_data.households_' || lower(state[1]) || ' USING gist (geom);';
        RAISE NOTICE 'Executing %', expr;
        EXECUTE expr;

        RAISE NOTICE '**** INDEXING GEOGRAPHY ****';
        expr := 'CREATE INDEX temp_households_' || lower(state[1]) || '_geog_gist ON temp_hh_data.households_' || lower(state[1]) || ' USING gist (geog);';
        RAISE NOTICE 'Executing %', expr;
        EXECUTE expr;

    END LOOP;
END$$;
