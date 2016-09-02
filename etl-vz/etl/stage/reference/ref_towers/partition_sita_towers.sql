DO $$
DECLARE
    all_states text[][] := array[['NY', '36'], ['WA', '53']];
    state text[];
    current_table text;
    insert_expr text;

BEGIN
    
    -- Loop for creating partitioned subtables
    FOREACH state SLICE 1 IN ARRAY all_states
    LOOP

        RAISE NOTICE '*************************';
        RAISE NOTICE '*** CURRENT STATE: %', state[1];

        current_table := 'ref_towers_data.sita_towers_' || lower(state[1]);
        
        RAISE NOTICE '**** CREATING TABLE ****';
        EXECUTE 'CREATE TABLE ' || current_table || ' (CHECK (upper(parcel_state) = ''' || state[1] || '''), CONSTRAINT ref_towers_' || lower(state[1]) || '_pkey PRIMARY KEY (sita_number)) INHERITS (ref_towers.sita_towers);';

        RAISE NOTICE '**** INSERTING TOWERS ****';
        EXECUTE 'INSERT INTO ' || current_table || ' SELECT * FROM ref_towers.sita_towers WHERE upper(parcel_state) = ''' || state[1] || ''';';
    END LOOP;
END$$;