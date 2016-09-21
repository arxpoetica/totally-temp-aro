-- We need a unique ID for vz_customers

-- Same function as public since the target table structure stays the same between both.
CREATE OR REPLACE FUNCTION aro.create_businesses_shard_table(state_abbrev text, target_schema_name text)
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
    parent_schema := 'aro';
    parent_table_name := 'businesses';
    table_name := target_schema_name || '.' || parent_table_name || '_' || state_name;
    prefix_name := parent_schema || '_' || parent_table_name;
    index_prefix_name := prefix_name || '_' || state_name;
    scoped_name := parent_schema || '.' || parent_table_name;


    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || table_name || ' (CHECK (state = ''' || state_name || ''' OR state = ''' || state_abbrev || ''')) INHERITS (' || scoped_name || ');';
    
    EXECUTE 'ALTER TABLE ' || table_name || ' ADD CONSTRAINT ' || index_prefix_name || '_pkey PRIMARY KEY (id);'; 

    EXECUTE 'CREATE INDEX ' || index_prefix_name || '_location_index ON ' || table_name || '(location_id);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name || '_industry_index ON ' || table_name || '(industry_id);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name ||  '_geog_gist ON ' || table_name || ' USING gist (geog);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name ||  '_geom_gist ON ' || table_name || ' USING gist (geom);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name || '_name_search_index ON ' || table_name || ' USING GIN (to_tsvector(''english'', name));';
    RETURN table_name;
END;
$table_name$ LANGUAGE plpgsql;

-- Load VZ TAM businesses into aro.locations and aro.businesses tables
-- source_table = 'businesses.tam_ny', target_schema_name = 'aro_location_data', state_abbrev = 'NY'
CREATE OR REPLACE FUNCTION aro.load_shard_infousa_businesses(scoped_source_table text, target_schema text, state_abbrev text)
RETURNS integer AS $records_loaded_count$
DECLARE
  records_loaded_count int;
  target_table text;
  scoped_target_table text;
  state_name text;
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
  target_table := 'businesses';
  location_table := 'locations';
  records_loaded_count := 0;

  state_name := lower(state_abbrev);
  scoped_target_table := target_schema || '.' || target_table || '_' || state_name;
  scoped_location_table := target_schema || '.' || location_table || '_' || state_name;
  missing_entities_index := target_schema || '_temp_missing_' || target_table || '_' || state_name;
  missing_entities_table := target_schema || '.temp_missing_' || target_table || '_' || state_name;

  RAISE NOTICE 'CREATING MISSING ENTITIES TABLE FOR %', state_abbrev;

  EXECUTE 'DROP TABLE IF EXISTS ' || missing_entities_table || ';';
  missing_expr := 'CREATE TABLE ' || missing_entities_table || ' AS     
  SELECT
    sourceid AS source_id, 
    lat as longitude,
    long as latitude,
    ST_Buffer(ST_MakePoint(long, lat)::geography, 5)::geometry AS buffer
  FROM ' || scoped_source_table || ' st
  LEFT JOIN  ' || scoped_target_table || '  tt
    ON st.sourceid::varchar = tt.source_id
  WHERE tt.id IS NULL
  AND NOT(long = 0 AND lat = 0);';

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
      SELECT DISTINCT ON (e.latitude, e.longitude)
          ml.location_id,
          e.address,
          e.city,
          ''' || state_abbrev || ''',
          e.zip, 
          e.lat,
          e.long,
          ST_SetSRID(ST_Point(long, lat), 4326),
          ST_SetSRID(ST_Point(long, lat), 4326)::geography
      FROM ' || scoped_source_table  || ' e
      JOIN missing_locations ml
          ON ml.source_id = e.sourceid::varchar
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
     INSERT INTO  ' || scoped_target_table || ' (location_id, source_id, industry_id, name, address, state, number_of_employees, source, geog, geom)
        SELECT  
            m.location_id,
            me.source_id,
            e.sic4,
            e.business,
            e.address,
            ''' || state_abbrev || ''',
            e.emps,
            ''infousa'',
            e.geog,
            e.geog::geometry
        FROM ' || missing_entities_table || ' me
        JOIN ' || scoped_source_table  || ' e
          ON me.source_id = e.sourceid::varchar
        JOIN matched_entities m
            ON m.longitude = me.longitude
            AND m.latitude = me.latitude 
   RETURNING id
  )
  SELECT COUNT(*) FROM updated_entities;';

  RAISE NOTICE 'MATCHING BUSINESSES TO LOCATIONS FOR %', state_abbrev;
  EXECUTE update_expr;

  RAISE NOTICE 'DROPPING MISSING ENTITIES TABLE FOR %', state_abbrev;
  EXECUTE 'DROP TABLE ' || missing_entities_table || ';';
  
  RETURN records_loaded_count;
END;
$records_loaded_count$ LANGUAGE plpgsql;
