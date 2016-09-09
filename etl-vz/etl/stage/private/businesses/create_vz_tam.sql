DROP TABLE IF EXISTS businesses.tam;

CREATE TABLE businesses.tam
(
	duns_number varchar,
	guduns varchar,
	total_tam_2015 numeric,
	emp_tot int,
	emp_here int,
	business_nm varchar,
	secondary_nm varchar,
	street_addr varchar,
	city varchar,
	state_abbrev varchar,
	zip_cd varchar,
	zip_plus_4 varchar,
	original_latitude double precision,
	original_longitude double precision,
	arcgis_longitude double precision,
	arcgis_latitude double precision
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

        current_table := 'businesses_data.tam_' || lower(state[1]);
        
        RAISE NOTICE '**** CREATING TABLE ****';
        EXECUTE 'CREATE TABLE ' || current_table || ' (CHECK (upper(state_abbrev) = ''' || state[1] || ''')) INHERITS (businesses.tam);';

    END LOOP;
END$$;