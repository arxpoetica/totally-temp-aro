-- all of tbhe functions needed to create tables for household stage

-- Create an empty table for household from a given state
-- Creates tables by state
-- Not inheriting from a master table here
-- SELECT create_households_table('MA', 'households')
CREATE OR REPLACE FUNCTION households.create_households_table(state_abbrev text, target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
    base_table_name text;
    table_name text;
    prefix_name text;
    index_prefix_name text;
    scoped_table_name text;
    state_name text;
BEGIN
    state_name := lower(state_abbrev);
    base_table_name := 'vz_households';
    table_name := base_table_name || '_' || state_name;
    scoped_table_name := target_schema_name || '.' || base_table_name || '_' || state_name;
    prefix_name := target_schema_name || '_' || base_table_name || '_' || state_name || '_';
    index_prefix_name := prefix_name || '_' || state_name || '_';

    EXECUTE 'DROP TABLE IF EXISTS ' || scoped_table_name || ' CASCADE;';
    EXECUTE 'CREATE TABLE ' || scoped_table_name || ' (
        id serial,
        address varchar,
        city varchar,
        state varchar,
        zipcode varchar,
        lat double precision,
        lon double precision,
        address_id varchar,
        income_level varchar,
        education_level varchar,
        credit_quality varchar,
        geog geography(POINT, 4326),
        CONSTRAINT temp_households_pkey PRIMARY KEY (id) 
    );';

    EXECUTE 'SELECT AddGeometryColumn(''' || target_schema_name || ''', ''' || table_name || ''', ''geom'', 4326, ''POINT'', 2);';
    RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;

-- Index function should be run after creating table and loading records
CREATE OR REPLACE FUNCTION households.create_households_indexes(state_abbrev text, target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
    base_table_name text;
    prefix_name text;
    index_prefix_name text;
    scoped_table_name text;
    state_name text;
BEGIN
    state_name := lower(state_abbrev);
    base_table_name := 'vz_households';
    scoped_table_name := target_schema_name || '.' || base_table_name || '_' || state_name;
    index_prefix_name := target_schema_name || '_' || base_table_name || '_' || state_name || '_';

    EXECUTE 'UPDATE ' || scoped_table_name || ' SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326);';
    EXECUTE 'UPDATE ' || scoped_table_name || ' SET geog = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography;';
    EXECUTE 'CREATE INDEX ' || index_prefix_name || 'geog_gist ON ' || scoped_table_name || ' USING GIST (geog);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name || 'geom_gist ON ' || scoped_table_name || ' USING GIST (geom);';
    RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;