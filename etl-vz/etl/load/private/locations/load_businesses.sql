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
    
    --EXECUTE 'DROP TABLE IF EXISTS ' || table_name;
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || table_name || ' (CHECK (state = ''' || state_name || ''' OR state = ''' || state_abbrev || ''')) INHERITS (' || scoped_name || ');';
    EXECUTE 'CREATE INDEX ' || index_prefix_name || '_location_index ON ' || table_name || '(location_id);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name || '_industry_index ON ' || table_name || '(industry_id);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name ||  '_geog_gist ON ' || table_name || ' USING gist (geog);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name ||  '_geom_gist ON ' || table_name || ' USING gist (geom);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name || '_name_search_index ON ' || table_name || ' USING GIN (to_tsvector(''english'', name));';
    RETURN table_name;
END;
$table_name$ LANGUAGE plpgsql;

-- Load VZ TAM businesses into aro.locations and aro.businesses tables
-- source_table = 'businesses.tam_ny', target_schema_name = 'aro', state_abbrev = 'NY'
CREATE OR REPLACE FUNCTION aro.load_shard_tam_businesses(scoped_source_table text, target_schema text, state_abbrev text)
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
      duns_number AS source_id, 
      ST_BUFFER(ST_MakePoint(longitude, latitude)::geography, 5)::geometry AS buffer
  FROM ' || scoped_source_table || ' st
  LEFT JOIN ' || scoped_target_table || ' tt
      ON st.duns_number = tt.source_id
  WHERE tt.id IS NULL ;';

  EXECUTE missing_expr;

  EXECUTE 'CREATE INDEX  tmp_' || missing_entities_index || '_buffer_gist ON ' || missing_entities_table || ' USING gist(buffer);';
  EXECUTE 'CREATE INDEX  tmp_' || missing_entities_index || '_buffer_source_id ON ' || missing_entities_table || ' USING btree(source_id);';

  update_expr := 'WITH matched_locations AS (
  SELECT
     me.source_id,
     l.id AS location_id
  FROM ' || missing_entities_table || ' me
  JOIN ' || scoped_location_table || ' l
      ON ST_Contains(me.buffer, l.geom)
  ),
  missing_locations AS (
      SELECT
          me.source_id,
          (SELECT nextval(''locations_id_seq''::regclass)) AS location_id
      FROM ' || missing_entities_table || ' me
      LEFT JOIN matched_locations ml
          ON ml.source_id = me.source_id
      WHERE ml.source_id IS NULL
  ),
  new_locations AS
  (
      INSERT INTO ' || scoped_location_table || ' (id, address, city, state, zipcode, lat, lon, geom, geog)
          SELECT DISTINCT ON (e.latitude, e.longitude)
              ml.location_id,
              e.street_addr,
              e.city,
              e.state,
              e.zip_cd, 
              e.latitude,
              e.longitude,
              ST_SetSRID(ST_Point(longitude, latitude), 4326),
              ST_SetSRID(ST_Point(longitude, latitude), 4326)::geography
          FROM ' || scoped_source_table  || ' e
          JOIN missing_locations ml
              ON ml.source_id = e.duns_number
          RETURNING id
  ),
  matched_entities AS (
      SELECT location_id, source_id FROM matched_locations

      UNION

      SELECT location_id, source_id FROM missing_locations
  ),
  updated_entities AS (
       INSERT INTO  ' || scoped_target_table || ' (location_id, source_id, industry_id, name, address, state, number_of_employees, source, geog, geom)
          SELECT  
              me.location_id,
              me.source_id,
              (SELECT id FROM aro.industries WHERE description = ''MENS & BOYS CLOTHING STORES''),
              e.business_nm,
              e.street_addr,
              ''' || state_abbrev || ''',
              e.emp_here,
              ''tam'',
              ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography AS geog,
              ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) AS geom
          FROM  ' || scoped_source_table || ' e
          JOIN matched_entities me
              ON me.source_id = e.duns_number
  )
  SELECT COUNT(*) FROM ' || scoped_target_table || ';';

  RAISE NOTICE 'MATCHING BUSINESSES TO LOCATIONS FOR %', state_abbrev;
  EXECUTE update_expr;

  RAISE NOTICE 'DROPPING MISSING ENTITIES TABLE FOR %', state_abbrev;
  EXECUTE 'DROP TABLE ' || missing_entities_table || ';';
  
  RETURN records_loaded_count;
END;
$records_loaded_count$ LANGUAGE plpgsql;

-- Load VZ TAM businesses into aro.locations and aro.businesses tables
-- source_table = 'businesses.vz_customers_ny', target_schema_name = 'aro', state_abbrev = 'NY'
CREATE OR REPLACE FUNCTION aro.load_shard_customer_businesses(scoped_source_table text, target_schema text, state_abbrev text)
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
      (SELECT md5(conc)) AS source_id,
      ST_BUFFER(ST_MakePoint(prism_long, prism_lat)::geography, 5)::geometry AS buffer
  FROM ' || scoped_source_table || ' st
  LEFT JOIN ' || scoped_target_table || ' tt
      ON md5(st.conc) = tt.source_id
  WHERE tt.id IS NULL ;';

  EXECUTE missing_expr;

  EXECUTE 'CREATE INDEX  tmp_' || missing_entities_index || '_buffer_gist ON ' || missing_entities_table || ' USING gist(buffer);';
  EXECUTE 'CREATE INDEX  tmp_' || missing_entities_index || '_buffer_source_id ON ' || missing_entities_table || ' USING btree(source_id);';

  update_expr := 'WITH matched_locations AS (
  SELECT
     me.source_id,
     l.id AS location_id
  FROM ' || missing_entities_table || ' me
  JOIN ' || scoped_location_table || ' l
      ON ST_Contains(me.buffer, l.geom)
  ),
  missing_locations AS (
      SELECT
          me.source_id,
          (SELECT nextval(''locations_id_seq''::regclass)) AS location_id
      FROM ' || missing_entities_table || ' me
      LEFT JOIN matched_locations ml
          ON ml.source_id = me.source_id
      WHERE ml.source_id IS NULL
  ),
  new_locations AS
  (
      INSERT INTO ' || scoped_location_table || ' (id, address, lat, lon, geom, geog)
          SELECT DISTINCT ON (e.prism_lat, e.prism_long)
              ml.location_id,
              e.prism_formatted_address,
              e.prism_lat,
              e.prism_long,
              ST_SetSRID(ST_Point(prism_long, prism_lat), 4326),
              ST_SetSRID(ST_Point(prism_long, prism_lat), 4326)::geography
          FROM ' || scoped_source_table  || ' e
          JOIN missing_locations ml
              ON ml.source_id = md5(e.conc)
          RETURNING id
  ),
  matched_entities AS (
      SELECT location_id, source_id FROM matched_locations

      UNION

      SELECT location_id, source_id FROM missing_locations
  ),
  updated_entities AS (
       INSERT INTO  ' || scoped_target_table || ' (location_id, source_id, industry_id, address, state, number_of_employees, annual_recurring_cost, monthly_recurring_cost, source, geog, geom)
          SELECT  
              me.location_id,
              me.source_id,
              (SELECT id FROM aro.industries WHERE description = ''MENS & BOYS CLOTHING STORES''),
              e.prism_formatted_address,
              ''' || state_abbrev || ''',
              1000,
              grand_total * 12,
              grand_total,
              ''vz_customers'',
              ST_SetSRID(ST_MakePoint(prism_long, prism_lat), 4326)::geography AS geog,
              ST_SetSRID(ST_MakePoint(prism_long, prism_lat), 4326) AS geom
          FROM  ' || scoped_source_table || ' e
          JOIN matched_entities me
              ON me.source_id = md5(e.conc)
  )
  SELECT COUNT(*) FROM ' || scoped_target_table || ';';

  RAISE NOTICE 'MATCHING BUSINESSES TO LOCATIONS FOR %', state_abbrev;
  EXECUTE update_expr;

  RAISE NOTICE 'DROPPING MISSING ENTITIES TABLE FOR %', state_abbrev;
  EXECUTE 'DROP TABLE ' || missing_entities_table || ';';
  
  RETURN records_loaded_count;
END;
$records_loaded_count$ LANGUAGE plpgsql;