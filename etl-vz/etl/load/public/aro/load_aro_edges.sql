DO $$
DECLARE
    all_states text[][] := array[['FL', '12'], ['WA', '53']];

    state text[];
    master_schema text := 'aro';
    data_schema text := 'aro_data';
    source_data_schema text := 'tiger_data';

    expr text;
    expr2 text;
    expr_start timestamp;
    state_start timestamp;
    expr_result record;
    
    i_rows INTEGER;

    current_table text;
    current_source_table text;
    current_table_suffix text;
    current_table_as_text text;

BEGIN

    -- Main loop for each state
    FOREACH state SLICE 1 IN ARRAY all_states
    LOOP

        RAISE NOTICE '*************************';
        RAISE NOTICE '*** CURRENT STATE: %', state[1];

        current_table := data_schema || '.' || lower(state[1]) || '_edges';
        current_source_table := source_data_schema || '.' || lower(state[1])|| '_edges';
        state_start := timeofday()::timestamp;
        

        RAISE NOTICE '**** CREATING TABLE ****';
        EXECUTE 'CREATE TABLE ' || current_table || ' (CHECK (statefp = ''' || state[2] || '''), CONSTRAINT pkey_aro_' || lower(state[1]) || '_edges_gid PRIMARY KEY (gid)) INHERITS (aro.edges);';

        
        expr2 := 'INSERT INTO ' || current_table || '
                (
                    gid,
                    statefp,
                    countyfp,
                    tlid,
                    tnidf,
                    tnidt,
                    edge_type,
                    geom,
                    geog,
                    edge_length,
                    buffer
                )
                SELECT
                    gid,
                    statefp,
                    countyfp,
                    tlid,
                    tnidf,
                    tnidt,
                    ''road_segment''::text AS edge_type,
                    ST_Transform(the_geom, 4326) as geom,
                    Geography(ST_Transform(the_geom, 4326)) as geog,
                    ST_Length(Geography(ST_Transform(the_geom, 4326))) as edge_length,
                    ST_Buffer(ST_Transform(the_geom, 4326), 40) as buffer
                FROM
                    ' || current_source_table || ' 
                WHERE
                    mtfcc IN ( ''C3061'',''C3062'',''S1200'',''S1400'',''S1630'',''S1640'' );';
        RAISE NOTICE '**** INSERTING DATA FROM EDGES TABLE ****';
        expr_start := timeofday()::timestamp;
        EXECUTE expr2;
        GET CURRENT DIAGNOSTICS i_rows = ROW_COUNT;
        RAISE NOTICE '----- % rows inserted in % seconds', i_rows, EXTRACT(epoch FROM timeofday()::timestamp - expr_start) as seconds;

        expr := 'CREATE INDEX idx_aro_data_' || lower(state[1]) || '_edges_statefp ON ' || current_table || ' USING btree (statefp);';
        RAISE NOTICE '**** CREATING INDEX ON statefp ****';
        EXECUTE expr;
        expr := 'CREATE INDEX idx_aro_data_' || lower(state[1]) || '_edges_countyfp ON ' || current_table || ' USING btree (countyfp);';
        RAISE NOTICE '**** CREATING INDEX ON countyfp ****';
        EXECUTE expr;
        expr := 'CREATE INDEX idx_aro_data_' || lower(state[1]) || '_edges_geom ON ' || current_table || ' USING gist (geom);';
        RAISE NOTICE '**** CREATING INDEX ON geom ****';
        EXECUTE expr;
        expr := 'CREATE INDEX idx_aro_data_' || lower(state[1]) || '_edges_geog ON ' || current_table || ' USING gist (geog);';
        RAISE NOTICE '**** CREATING INDEX ON geog ****';
        EXECUTE expr;
        expr := 'CREATE INDEX idx_aro_data_' || lower(state[1]) || '_edges_buffer ON ' || current_table || ' USING gist (buffer);';
        RAISE NOTICE '**** CREATING INDEX ON buffer ****';
        EXECUTE expr;
        
        RAISE NOTICE '*** State completed in % seconds', EXTRACT(epoch FROM timeofday()::timestamp - state_start) as seconds;
        
    END LOOP;

END$$;