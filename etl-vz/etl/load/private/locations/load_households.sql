-- Create a table to put the temp households in
-- We need these only temporarily to load the aro.households table
-- Temp households have the location info, we do missing location on these
CREATE OR REPLACE FUNCTION aro.create_temp_households_shard_table(state_abbrev text, target_schema_name text)
RETURNS text AS $table_name$
DECLARE
    table_name text;
    parent_schema text;
    parent_table_name text;
    prefix_name text;
    index_prefix_name text;
    scoped_name text;
    state_name text;
    state_name_upper text;
BEGIN
    state_name := lower(state_abbrev);
    state_name_upper := upper(state_abbrev);
    parent_schema := 'aro';
    parent_table_name := 'temp_households';
    table_name := target_schema_name || '.' || parent_table_name || '_' || state_name;
    prefix_name := parent_schema || '_' || parent_table_name;
    index_prefix_name := prefix_name || '_' || state_name;
    scoped_name := parent_schema || '.' || parent_table_name;

    RAISE NOTICE 'CREATING TEMP HOUSEHOLDS TABLE FOR %', state_abbrev;

    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || table_name || ' (CHECK (upper(state) = ''' || state_name_upper || ''')) INHERITS (' || scoped_name || ');';
    
    EXECUTE 'ALTER TABLE ' || table_name || ' ADD CONSTRAINT ' || index_prefix_name || '_pkey PRIMARY KEY (id);';

    EXECUTE 'CREATE INDEX ' || index_prefix_name || '_location_index ON ' || table_name || '(location_id);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name ||  '_geog_gist ON ' || table_name || ' USING gist (geog);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name ||  '_geom_gist ON ' || table_name || ' USING gist (geom);';
    RETURN table_name;
END;
$table_name$ LANGUAGE plpgsql;

-- Temp households is a temporary interrment for household locations
-- We later count these and add the count to aro.households
-- Then the temp_households are dropped
CREATE OR REPLACE FUNCTION aro.load_shard_temp_households(state_abbrev text, target_schema_name text)
RETURNS integer AS $records_loaded_count$
DECLARE
  records_loaded_count int;
  target_table text;
  scoped_target_table text;
  source_schema text;
  source_table text;
  scoped_source_table text;
  state_name text;
  state_name_upper text;
  table_name text;
  index_prefix text;
  location_table text;
  scoped_location_table text;
  missing_entities_index text;
  missing_entities_table text;
  missing_expr text;
  update_expr text;

BEGIN
  -- Constants
  target_table := 'temp_households';
  location_table := 'locations';
  records_loaded_count := 0;

  state_name := lower(state_abbrev);
  state_name_upper := upper(state_abbrev) ;
  scoped_target_table := target_schema_name || '.' || target_table || '_' || state_name;
  scoped_location_table := target_schema_name || '.' || location_table || '_' || state_name;
  source_schema := 'households';
  source_table := 'vz_households' || '_' || state_name;
  scoped_source_table := source_schema || '.' || source_table;
  missing_entities_index := target_schema_name || '_temp_missing_' || target_table || '_' || state_name;
  missing_entities_table := target_schema_name || '.temp_missing_' || target_table || '_' || state_name;

  RAISE NOTICE 'CREATING MISSING ENTITIES TABLE FOR %', state_abbrev;

  EXECUTE 'DROP TABLE IF EXISTS ' || missing_entities_table || ';';
  missing_expr := 'CREATE TABLE ' || missing_entities_table || ' AS     
  SELECT
    st.id::varchar AS source_id, 
    st.lon AS longitude,
    st.lat AS latitude,
    ST_Buffer(ST_MakePoint(st.lon, st.lat)::geography, 5)::geometry AS buffer
  FROM ' || scoped_source_table || ' st
  LEFT JOIN  ' || scoped_target_table || '  tt
    ON st.id::varchar = tt.source_id
  WHERE tt.id IS NULL;';

  EXECUTE missing_expr;

  EXECUTE 'CREATE INDEX  tmp_' || missing_entities_index || '_buffer_gist ON ' || missing_entities_table || ' USING gist(buffer);';
  EXECUTE 'CREATE INDEX  tmp_' || missing_entities_index || '_buffer_source_id ON ' || missing_entities_table || ' USING btree(source_id);';
  EXECUTE 'CREATE INDEX  tmp_' || missing_entities_index || '_latitude ON ' || missing_entities_table || ' USING btree(latitude);';
  EXECUTE 'CREATE INDEX  tmp_' || missing_entities_index || '_longitude ON ' || missing_entities_table || ' USING btree(longitude);';

  update_expr := 'WITH distinct_locations AS (
    SELECT 
      MAX(source_id) AS source_id, 
      longitude, 
      latitude
    FROM ' || missing_entities_table || ' 
    GROUP BY longitude, latitude
  ),
  matched_locations AS (
    SELECT
       me.source_id,
       MAX(l.id) AS location_id
    FROM distinct_locations dl
    JOIN ' || missing_entities_table || '  me
          ON me.source_id = dl.source_id
    JOIN ' || scoped_location_table || ' l
        ON ST_Contains(me.buffer, l.geom)
     GROUP BY me.source_id
   ),
  missing_locations AS (
    SELECT
        dl.source_id,
        nextval(''aro.locations_id_seq''::regclass) AS location_id
    FROM distinct_locations dl
    LEFT JOIN matched_locations ml
          ON ml.source_id = dl.source_id
    WHERE ml.source_id IS NULL
  ),
  new_locations AS
  (
    INSERT INTO ' || scoped_location_table || ' (id, address, city, state, zipcode, lat, lon, geom, geog)
      SELECT DISTINCT ON (e.lat, e.lon)
          ml.location_id,
          e.address,
          e.city,
          ''' || state_name_upper || ''',
          e.zipcode, 
          e.lat,
          e.lon,
          ST_SetSRID(ST_Point(e.lon, e.lat), 4326),
          ST_SetSRID(ST_Point(e.lon, e.lat), 4326)::geography
      FROM ' || scoped_source_table  || ' e
      JOIN missing_locations ml
          ON ml.source_id = e.id::varchar
      RETURNING id, lon AS longitude, lat as latitude
  ),
  matched_entities AS (
    SELECT location_id, longitude, latitude
    FROM matched_locations ml
    JOIN ' || missing_entities_table || ' me
    ON me.source_id = ml.source_id

    UNION

    SELECT location_id, longitude, latitude
    FROM missing_locations ml
    JOIN ' || missing_entities_table || ' me
    ON me.source_id = ml.source_id
  ),
  updated_entities AS (
     INSERT INTO  ' || scoped_target_table || ' (location_id, source_id, address, city, zipcode, state, geog, geom)
        SELECT  
            m.location_id,
            me.source_id,
            e.address,
            e.city,
            e.zipcode,
            ''' || state_name_upper || ''',
            ST_SetSRID(ST_MakePoint(e.lon, e.lat), 4326)::geography AS geog,
            ST_SetSRID(ST_MakePoint(e.lon, e.lat), 4326) AS geom
        FROM ' || missing_entities_table || ' me
        JOIN ' || scoped_source_table  || ' e
          ON me.source_id = e.id::varchar
        JOIN matched_entities m
            ON m.longitude = me.longitude
            AND m.latitude = me.latitude 
   RETURNING id
  )
  SELECT COUNT(*) FROM updated_entities;';

  RAISE NOTICE 'MATCHING HOUSEHOLDS TO LOCATIONS FOR %', state_abbrev;
  EXECUTE update_expr;

  RAISE NOTICE 'DROPPING MISSING ENTITIES TABLE FOR %', state_abbrev;
  EXECUTE 'DROP TABLE ' || missing_entities_table || ';';
  
  RETURN records_loaded_count;
END;
$records_loaded_count$ LANGUAGE plpgsql;

-- Drop the temp_hh table after aro.households have been loaded
CREATE OR REPLACE FUNCTION aro.drop_temp_households_shard(state_abbrev text, target_schema_name text)
RETURNS text AS $scoped_target_table$
DECLARE
  target_table text;
  scoped_target_table text;
  state_name text;
  table_name text;
BEGIN
  -- Constants
  state_name := lower(state_abbrev);
  target_table := 'temp_households';
  scoped_target_table := target_schema_name || '.' || target_table || '_' || state_name;

  RAISE NOTICE 'DROPPING TEMP HOUSEHOLDS TABLE FOR %', state_abbrev;
  EXECUTE 'DROP TABLE IF EXISTS ' || scoped_target_table;
  RETURN scoped_target_table;
END;
$scoped_target_table$ LANGUAGE plpgsql;

-- Create partitions for the household counts
CREATE OR REPLACE FUNCTION aro.create_households_shard_table(state_abbrev text, target_schema_name text)
RETURNS text AS $table_name$
DECLARE
    table_name text;
    parent_schema text;
    parent_table_name text;
    prefix_name text;
    index_prefix_name text;
    scoped_name text;
    state_name text;
    state_name_upper text;
BEGIN
    state_name := lower(state_abbrev);
    state_name_upper := upper(state_abbrev);
    parent_schema := 'aro';
    parent_table_name := 'households';
    table_name := target_schema_name || '.' || parent_table_name || '_' || state_name;
    prefix_name := parent_schema || '_' || parent_table_name;
    index_prefix_name := prefix_name || '_' || state_name;
    scoped_name := parent_schema || '.' || parent_table_name;

    RAISE NOTICE 'CREATING HOUSEHOLDS TABLE FOR %', state_abbrev;

    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || table_name || ' (CHECK (upper(state) = ''' || state_name_upper || ''')) INHERITS (' || scoped_name || ');';
    
    EXECUTE 'ALTER TABLE ' || table_name || ' ADD CONSTRAINT ' || index_prefix_name || '_pkey PRIMARY KEY (id);';

    EXECUTE 'CREATE INDEX ' || index_prefix_name || '_location_index ON ' || table_name || '(location_id);';
    RETURN table_name;
END;
$table_name$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION aro.load_shard_households(state_abbrev text, target_schema_name text)
RETURNS text AS $scoped_target_table$
DECLARE
	target_table text;
	scoped_target_table text;
	source_table text;
	source_schema text;
	scoped_source_table text;
	location_table text;
	location_schema text;
	scoped_location_table text;
	state_name text;

BEGIN
	state_name := lower(state_abbrev);
	target_table := 'households';
	scoped_target_table := target_schema_name || '.' || target_table || '_' || state_name;
	source_table := 'temp_households';
	source_schema := 'aro_location_data';
	scoped_source_table := source_schema || '.' || source_table || '_' || state_name;
	location_table := 'locations';
	location_schema := 'aro_location_data';
	scoped_location_table := location_schema || '.' || location_table || '_' || state_name;

	RAISE NOTICE 'LOADING HOUSEHOLD COUNTS FOR %', state_abbrev;
	EXECUTE 'INSERT INTO ' || scoped_target_table || ' (location_id, number_of_households)
		SELECT
			l.id AS location_id,
			COUNT(hh.location_id) AS hh_count
		FROM ' || scoped_source_table || ' hh
		JOIN ' || scoped_location_table || ' l 
			ON l.id = hh.location_id
		GROUP BY l.id;';
	RETURN scoped_target_table;
END;
$scoped_target_table$ LANGUAGE plpgsql;
