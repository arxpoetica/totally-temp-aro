DROP TABLE IF EXISTS businesses.vz_customers;

CREATE TABLE businesses.vz_customers
(
	conc varchar,
	state varchar,
	csalt_lata varchar,
	csalt_address_id varchar,
	srv_code varchar,
	wc_flag varchar,
	sub_ds1 numeric,
	ds1 numeric,
	ds3 numeric,
	oc3 numeric,
	oc12 numeric,
	oc48 numeric,
	oc192 numeric,
	oc768 numeric,
	ocn numeric,
	ethernet numeric,
	blank numeric,
	grand_total numeric,
	pprint_addy varchar,
	prism_source varchar,
	prism_formatted_address varchar,
	prism_rating varchar,
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

        current_table := 'businesses_data.vz_customers_'|| lower(state[1]);
        
        RAISE NOTICE '**** CREATING TABLE ****';
        -- How do we CHECK that it's going in the right state table when we don't have a field?
        EXECUTE 'CREATE TABLE ' || current_table || ' INHERITS (businesses.vz_customers);';

    END LOOP;
END$$;
