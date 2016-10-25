-- aro.create_fiber_plant_partition('WA', 'aro_fiber_plant_data')
CREATE OR REPLACE FUNCTION aro.create_fiber_plant_partition(state_abbrev text, target_schema text)
RETURNS text AS $scoped_table_name$
DECLARE
    base_table_name text;
    prefix_name text;
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
    scoped_table_name := target_schema || '.' || base_table_name || '_' || state_name;
    parent_schema := 'aro';
    parent_table := 'fiber_plant';
    scoped_parent_table := parent_schema || '.' || parent_table;
    prefix_name := target_schema || '_' || base_table_name || '_' || state_name || '_';

		EXECUTE 'DROP TABLE IF EXISTS ' || scoped_table_name || ' CASCADE;';
		EXECUTE 'CREATE TABLE ' || scoped_table_name || ' (CHECK (upper(state) = ''' || state_name_upper || ''')) INHERITS (' || scoped_parent_table || ');';
		EXECUTE 'CREATE INDEX ' || prefix_name || 'geom_gist ON ' || scoped_table_name || ' USING gist (geom);';
		EXECUTE 'CREATE INDEX ' || prefix_name || 'geog_gist ON ' || scoped_table_name || ' USING gist (geog);';
		EXECUTE 'CREATE INDEX ' || prefix_name || 'carrier_index ON ' || scoped_table_name || '(carrier_id);';
		EXECUTE 'CREATE INDEX ' || prefix_name || 'buffer_geom_gist ON ' || scoped_table_name || ' USING gist (buffer_geom);';

		RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;

-- aro.load_fiber_plant_partition('WA', 'aro_fiber_plant_data')
CREATE OR REPLACE FUNCTION aro.load_fiber_plant_partition(state_abbrev text, target_schema text)
RETURNS text AS $scoped_table_name$
DECLARE
    base_table_name text;
    prefix_name text;
    scoped_table_name text;
    source_table_base_name text;
    source_schema text;
    scoped_source_table text;
    state_name text;
    state_name_upper text;
BEGIN
    state_name := lower(state_abbrev);
    state_name_upper := upper(state_abbrev);
    base_table_name := 'fiber_plant';
    source_table_base_name := 'fiber_plant';
    source_schema := 'geotel_fiber_data';
    scoped_source_table := source_schema || '.' || source_table_base_name || '_' || state_name;
    scoped_table_name := target_schema || '.' || base_table_name || '_' || state_name;
    prefix_name := target_schema || '_' || base_table_name || '_' || state_name || '_';

    EXECUTE 'INSERT INTO ' || scoped_table_name || ' (gid, carrier_name, carrier_id, cbsa, state, plant_type, zipcode, geog, geom) 
    	SELECT
    		gid,
    		carrier AS carrier_name,
    		(SELECT id FROM aro.carriers WHERE carriers.name = carrier) AS carrier_id,
    		cbsa,
    		''' || state_name_upper || ''' AS state,
    		type AS plant_type,
    		zip AS zipcode,
    		Geography(ST_GeometryN(ST_Force_2D(the_geom),1)) as geog,
    		ST_GeometryN(ST_Force_2D(the_geom),1) AS geom
    	FROM ' || scoped_source_table || ';';

    EXECUTE 'UPDATE ' || scoped_table_name || ' SET buffer_geom=ST_Buffer(geog, 200)::geometry;';

    RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;
