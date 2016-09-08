DO $$
DECLARE
    all_states text[][] := array[['NY', '36']];
    state text[];
    expr text;
    current_table text;

BEGIN
    FOREACH state SLICE 1 IN ARRAY all_states
    LOOP
    	RAISE NOTICE '*** CREATE GEOMETRY FOR STATE: %', state[1];
    	current_table := 'temp_hh_data.households_' || lower(state[1]);
    	expr := 'UPDATE ' || current_table || ' SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326);';
    	EXECUTE expr;
    END LOOP;
END$$;