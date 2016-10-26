
-- SELECT create_geotel_fiber_master_table('geotel');
CREATE OR REPLACE FUNCTION create_geotel_fiber_master_table(target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
    table_name text;
    scoped_table_name text;
    index_prefix_name text;
    
BEGIN
		table_name := 'fiber_plant';
		scoped_table_name := target_schema_name || '.' || table_name;
		index_prefix_name := target_schema_name || '_' || table_name || '_';

    EXECUTE 'DROP TABLE IF EXISTS ' || scoped_table_name || ' CASCADE;';

    EXECUTE 'CREATE TABLE ' || scoped_table_name || ' (
			gid serial,
			id double precision,
			carrier varchar(50),
			type varchar(20),
			cbsa varchar(9),
			lata varchar(5),
			zip varchar(6),
			state varchar(2),
			CONSTRAINT ' || index_prefix_name || 'pkey PRIMARY KEY (gid)
     );';
		
		EXECUTE 'SELECT AddGeometryColumn(''' || target_schema_name || ''', ''' || table_name || ''', ''the_geom'', 4326, ''MULTILINESTRING'', 2);';

		RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;

-- SELECT create_geotel_fiber_partition_table('GA', 'geotel_fiber_data')
CREATE OR REPLACE FUNCTION create_geotel_fiber_partition_table(state_abbrev text, target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
    base_table_name text;
    scoped_table_name text;
    state_name text;
    state_name_upper text;
    parent_schema text;
    parent_table text;
    scoped_parent_table text;
BEGIN
    state_name := lower(state_abbrev);
    state_name_upper := upper(state_abbrev);
    base_table_name := 'fiber_plant';
    scoped_table_name := target_schema_name || '.' || base_table_name || '_' || state_name;
    parent_schema := 'geotel';
    parent_table := 'fiber_plant';
    scoped_parent_table := parent_schema || '.' || parent_table;

    EXECUTE 'DROP TABLE IF EXISTS ' || scoped_table_name || ' CASCADE;';
    EXECUTE 'CREATE TABLE ' || scoped_table_name || ' (CHECK (upper(state) = ''' || state_name_upper || ''')) INHERITS (' || scoped_parent_table || ');';
    RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;


-- SELECT create_geotel_wirecenters_master_table('geotel');
CREATE OR REPLACE FUNCTION create_geotel_wirecenters_master_table(target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
    table_name text;
    scoped_table_name text;
    index_prefix_name text;
    
BEGIN
		table_name := 'wirecenters';
		scoped_table_name := target_schema_name || '.' || table_name;
		index_prefix_name := target_schema_name || '_' || table_name || '_';

    EXECUTE 'DROP TABLE IF EXISTS ' || scoped_table_name || ' CASCADE;';

    EXECUTE 'CREATE TABLE ' || scoped_table_name || ' (
			gid serial,
			state varchar(2),
			aocn varchar(10),
			aocn_name varchar(50),
			wirecenter varchar(50),
			lata varchar(50),
			CONSTRAINT ' || index_prefix_name || 'pkey PRIMARY KEY (gid)
     );';
		
		EXECUTE 'SELECT AddGeometryColumn(''' || target_schema_name || ''', ''' || table_name || ''', ''the_geom'', 4326, ''MULTIPOLYGON'', 2);';

		RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;

-- SELECT create_geotel_wirecenters_partition_table('GA', 'geotel_wirecenter_data')
CREATE OR REPLACE FUNCTION create_geotel_wirecenters_partition_table(state_abbrev text, target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
    base_table_name text;
    scoped_table_name text;
    state_name text;
    state_name_upper text;
    parent_schema text;
    parent_table text;
    scoped_parent_table text;
BEGIN
    state_name := lower(state_abbrev);
    state_name_upper := upper(state_abbrev);
    base_table_name := 'wirecenters';
    scoped_table_name := target_schema_name || '.' || base_table_name || '_' || state_name;
    parent_schema := 'geotel';
    parent_table := 'wirecenters';
    scoped_parent_table := parent_schema || '.' || parent_table;

    EXECUTE 'DROP TABLE IF EXISTS ' || scoped_table_name || ' CASCADE;';
    EXECUTE 'CREATE TABLE ' || scoped_table_name || ' (CHECK (upper(state) = ''' || state_name_upper || ''')) INHERITS (' || scoped_parent_table || ');';
    RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;



