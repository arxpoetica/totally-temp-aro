DROP TABLE IF EXISTS businesses.ves_lit;

CREATE TABLE businesses.ves_lit
(
	corporatename varchar,
	coclli varchar,
	address varchar,
	city varchar,
	state varchar,
	zip varchar,
	franchise_flag varchar,
	capacity varchar,
	n_total int,
	n_avail int,
	n_not_avail int,
	latitude double precision,
	longitude double precision,
	building_clli varchar
);

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

        current_table := 'ref_businesses_data.ves_lit_' || lower(state[1]);
        
        RAISE NOTICE '**** CREATING TABLE ****';
        EXECUTE 'CREATE TABLE ' || current_table || ' (CHECK (upper(state) = ''' || state[1] || ''')) INHERITS (businesses.ves_lit);';

    END LOOP;
END$$;

