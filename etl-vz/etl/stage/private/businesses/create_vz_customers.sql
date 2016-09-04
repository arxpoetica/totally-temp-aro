DROP TABLE IF EXISTS businesses.vz_customers;

CREATE TABLE businesses.vz_customers
(
	customer_key_location varchar,
	nasp_nm varchar,
	sum_mrc numeric,
	svc_location varchar,
	prism_source varchar,
	prism_formatted_address varchar,
	long double precision,
	lat double precision,
	is_2k boolean
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

        current_table := 'businesses_data.vz_customers_'|| lower(state[1]);
        
        RAISE NOTICE '**** CREATING TABLE ****';
        -- How do we CHECK that it's going in the right state table when we don't have a field?
        EXECUTE 'CREATE TABLE ' || current_table || ' INHERITS (businesses.vz_customers);';

    END LOOP;
END$$;