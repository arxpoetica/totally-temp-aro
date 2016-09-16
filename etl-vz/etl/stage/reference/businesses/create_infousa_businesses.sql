--
-- Create and Index functions for loading InfoUSA businesses into tables partitioned by state
--

CREATE OR REPLACE FUNCTION create_infousa_businesses_table(state_abbrev text, target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
    base_table_name text;
    prefix_name text;
    index_prefix_name text;
    scoped_table_name text;
    state_name text;
BEGIN
    state_name := lower(state_abbrev);
    base_table_name := 'infousa_businesses';
    scoped_table_name := target_schema_name || '.' || base_table_name || '_' || state_name;
    prefix_name := target_schema_name || '_' || base_table_name || '_' || state_name || '_';
    index_prefix_name := prefix_name || '_' || state_name || '_';

    EXECUTE 'DROP TABLE IF EXISTS ' || scoped_table_name || ' CASCADE;';
    EXECUTE 'CREATE TABLE ' || scoped_table_name || ' (
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
        );';
    RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;
      
-- Index function should be run after creating table and loading records
CREATE OR REPLACE FUNCTION create_infousa_businesses_indexes(state_abbrev text, target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
    base_table_name text;
    prefix_name text;
    index_prefix_name text;
    scoped_table_name text;
    state_name text;
BEGIN
    state_name := lower(state_abbrev);
    base_table_name := 'infousa_businesses';
    scoped_table_name := target_schema_name || '.' || base_table_name || '_' || state_name;
    index_prefix_name := target_schema_name || '_' || base_table_name || '_' || state_name || '_';

    EXECUTE 'CREATE INDEX ' || index_prefix_name || 'geog_gist ON ' || scoped_table_name || ' USING GIST (geog);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name || 'sic4 ON ' || scoped_table_name || ' USING btree (sic4);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name || 'sourceid ON ' || scoped_table_name || ' USING btree (sourceid);';
    RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;