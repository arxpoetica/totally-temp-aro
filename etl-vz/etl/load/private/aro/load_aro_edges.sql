
CREATE OR REPLACE FUNCTION aro.create_and_load_edge(shard_state text, state_code text)
RETURNS text AS $table_name$
DECLARE

    state_name text ;
    state_name_upper text ;

    table_name text;
    master_schema text := 'aro';
    data_schema text := 'aro_edges_data';
    source_data_schema text := 'tiger_data';

    expr text;
    expr2 text;
    expr_start timestamp;
    state_start timestamp;
    expr_result record;
   
    current_table text;
    current_source_table text;
    current_table_suffix text;
    current_table_as_text text;
BEGIN

        state_name := lower(shard_state) ;
        state_name_upper := upper(shard_state) ;

        RAISE NOTICE '*************************';
        RAISE NOTICE '*** CURRENT STATE: %', state_name;

        current_table := data_schema || '.edges_' || state_name;
        current_source_table := source_data_schema || '.' || state_name|| '_edges';
        state_start := timeofday()::timestamp;
        
        table_name := current_table ;

        RAISE NOTICE '**** CREATING TABLE ****';
        EXECUTE 'CREATE TABLE IF NOT EXISTS ' || current_table || '( CHECK (statefp = ''' || state_code || '''), CONSTRAINT pkey_aro_edges_' || state_name || '_gid PRIMARY KEY (gid)) INHERITS (aro.edges);';
        
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
        RAISE NOTICE '----- % rows inserted in % seconds', i_rows, EXTRACT(epoch FROM timeofday()::timestamp - expr_start) as seconds;

        expr := 'CREATE INDEX idx_aro_data_' || state_name || '_edges_statefp ON ' || current_table || ' USING btree (statefp);';
        RAISE NOTICE '**** CREATING INDEX ON statefp ****';
        EXECUTE expr;
        expr := 'CREATE INDEX idx_aro_data_' || lstate_name || '_edges_countyfp ON ' || current_table || ' USING btree (countyfp);';
        RAISE NOTICE '**** CREATING INDEX ON countyfp ****';
        EXECUTE expr;
        expr := 'CREATE INDEX idx_aro_data_' || state_name || '_edges_geom ON ' || current_table || ' USING gist (geom);';
        RAISE NOTICE '**** CREATING INDEX ON geom ****';
        EXECUTE expr;
        expr := 'CREATE INDEX idx_aro_data_' || state_name || '_edges_geog ON ' || current_table || ' USING gist (geog);';
        RAISE NOTICE '**** CREATING INDEX ON geog ****';
        EXECUTE expr;
        expr := 'CREATE INDEX idx_aro_data_' || state_name || '_edges_buffer ON ' || current_table || ' USING gist (buffer);';
        RAISE NOTICE '**** CREATING INDEX ON buffer ****';
        EXECUTE expr;
        
        RAISE NOTICE '*** State completed in % seconds', EXTRACT(epoch FROM timeofday()::timestamp - state_start) as seconds;

END;
$table_name$ LANGUAGE plpgsql;
