CREATE OR REPLACE FUNCTION aro.create_locations_shard_table(state_abbrev text, target_schema_name text)
RETURNS text AS $table_name$
DECLARE
  table_name text;
  parent_schema text;
  parent_table_name text;
  prefix_name text;
  index_prefix_name text;
  scoped_name text;
  state_name text;
BEGIN
  state_name := lower(state_abbrev);
  table_name := target_schema_name || '.' || 'locations_' || state_name;
  state_name := lower(state_abbrev);
  parent_schema := 'aro';
  parent_table_name := 'locations';
  table_name := target_schema_name || '.' || parent_table_name || '_' || state_name;
  prefix_name := parent_schema || '_' || parent_table_name;
  index_prefix_name := prefix_name || '_' || state_name;
  scoped_name := parent_schema || '.' || parent_table_name;
  
  
  EXECUTE 'DROP TABLE IF EXISTS ' || table_name;
  EXECUTE 'CREATE TABLE ' || table_name || ' (CHECK (state = ''' || state_name || ''' OR state = ''' || state_abbrev || ''')) INHERITS (' || scoped_name || ');';
  EXECUTE 'CREATE INDEX ' || index_prefix_name ||  '_geog_gist ON ' || table_name || ' USING gist (geog);';
  EXECUTE 'CREATE INDEX ' || index_prefix_name ||  '_geom_gist ON ' || table_name || ' USING gist (geom);';
  EXECUTE 'CREATE INDEX ' || index_prefix_name ||  '_total_businesses_index ON ' || table_name || '(total_businesses);';
  EXECUTE 'CREATE INDEX ' || index_prefix_name ||  '_total_households_index ON ' || table_name || '(total_households);';
  EXECUTE 'CREATE INDEX ' || index_prefix_name ||  '_total_towers_index ON ' || table_name || '(total_towers);';
  RETURN table_name;
END;
$table_name$ LANGUAGE plpgsql;