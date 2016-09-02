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

CREATE INDEX ref_businesses_infousa_geog_gist ON ref_businesses.infousa USING gist (geog);
CREATE INDEX ref_businesses_infousa_sic4 ON ref_businesses.infousa USING btree (sic4);

DO $$
DECLARE
    all_states text[][] := array[['NY', '36'], ['WA', '53']];
    state text[];

BEGIN
    
    -- Loop for creating partitioned subtables
    FOREACH state SLICE 1 IN ARRAY all_states
    LOOP

        RAISE NOTICE '*************************';
        RAISE NOTICE '*** CURRENT STATE: %', state[1];

        current_table := 'ref_businesses_data.infousa_' || lower(state[1]);
        
        RAISE NOTICE '**** CREATING TABLE ****';
        EXECUTE 'CREATE TABLE ' || current_table || ' (CHECK (state = ''' || state[1] || ''')) INHERITS (ref_businesses.infousa);';

        RAISE NOTICE '**** CREATING GEOGRAPHY INDEX ****';
        EXECUTE 'CREATE INDEX ref_businesses_infousa_' || state[1] || '_geog_gist ON ref_businesses_data.infousa_' || state[1] || ' USING gist (geog);';

        RAISE NOTICE '*** CREATING SIC4 INDEX ****';
        EXECUTE 'CREATE INDEX ref_businesses_infousa_' || state[1] || '_sic4 ON ref_businesses_data.infousa_' || state[1] || ' USING btree (sic4);';

    END LOOP;
END$$;