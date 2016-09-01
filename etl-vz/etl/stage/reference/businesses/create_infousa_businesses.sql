-- Table: public.infousa_businesses

DROP TABLE IF EXISTS ref_businesses.infousa CASCADE;

CREATE TABLE ref_businesses.infousa
(
business varchar,
address varchar,
city varchar,
state varchar,
zip varchar,
zip4 varchar,
emps integer,
sic4 integer,
sic4desc varchar,
bldgid bigint,
sourceid bigint,
lat double precision,
long double precision,
accuracy integer,
hqbranch integer,
familyid bigint,
familybus bigint,
familymsas integer,
geog geography (POINT, 4326) 
);

DO $$
DECLARE
    all_states text[][] := array[['NY', '36'], ['WA', '53']];
    state text[];
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
    
    -- Loop for creating partitioned subtables
    FOREACH state SLICE 1 IN ARRAY all_states
    LOOP

        RAISE NOTICE '*************************';
        RAISE NOTICE '*** CURRENT STATE: %', state[1];

        current_table := 'ref_businesses_data.infousa_' || lower(state[1]);
        state_start := timeofday()::timestamp;
        
        RAISE NOTICE '**** CREATING TABLE ****';
        expr := 'CREATE TABLE ' || current_table || ' (CHECK (state = ''' || state[1] || ''')) INHERITS (ref_businesses.infousa);';
        RAISE NOTICE 'Executing %', expr;
        EXECUTE expr;
    END LOOP;
END$$;