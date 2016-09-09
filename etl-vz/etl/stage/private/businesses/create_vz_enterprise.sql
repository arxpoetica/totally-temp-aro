DROP TABLE IF EXISTS businesses.vz_enterprise;

CREATE TABLE businesses.vz_enterprise
(
	customer_key_location varchar,
	nasp_nm varchar,
	sum_mrc numeric,
	svc_location varchar,
	prism_source varchar,
	prism_formatted_address varchar,
	prism_long double precision,
	prism_lat double precision
);

DO $$
DECLARE
    all_states text[][] := array[['FL', '12'], ['IL', '17'], ['MO', '29'] ['WA', '53']];
    state text[];
    current_table text;

BEGIN
    
    -- Loop for creating partitioned subtables
    FOREACH state SLICE 1 IN ARRAY all_states
    LOOP

        RAISE NOTICE '*************************';
        RAISE NOTICE '*** CURRENT STATE: %', state[1];

        current_table := 'businesses_data.vz_enterprise_' || lower(state[1]);
        
        RAISE NOTICE '**** CREATING TABLE ****';
        EXECUTE 'CREATE TABLE ' || current_table || ' INHERITS (businesses.vz_enterprise);';

    END LOOP;
END$$;