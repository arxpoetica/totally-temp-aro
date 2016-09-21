-- Same function as public since the target table structure stays the same between both.
CREATE OR REPLACE FUNCTION aro.create_towers_shard_table(state_abbrev text, target_schema_name text)
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
    parent_table_name := 'towers';
    table_name := target_schema_name || '.' || parent_table_name || '_' || state_name;
    prefix_name := parent_schema || '_' || parent_table_name;
    index_prefix_name := prefix_name || '_' || state_name;
    scoped_name := parent_schema || '.' || parent_table_name;


    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || table_name || ' (CHECK (parcel_state = ''' || state_name_upper || ''')) INHERITS (' || scoped_name || ');';
    
    EXECUTE 'ALTER TABLE ' || table_name || ' ADD CONSTRAINT ' || index_prefix_name || '_pkey PRIMARY KEY (id);'; 

    EXECUTE 'CREATE INDEX ' || index_prefix_name || '_location_index ON ' || table_name || '(location_id);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name ||  '_geog_gist ON ' || table_name || ' USING gist (geog);';
    EXECUTE 'CREATE INDEX ' || index_prefix_name ||  '_geom_gist ON ' || table_name || ' USING gist (geom);';
    RETURN table_name;
END;
$table_name$ LANGUAGE plpgsql;

-- Load VZ TAM businesses into aro.locations and aro.businesses tables
-- source_table = 'businesses.tam_ny', target_schema_name = 'aro_location_data', state_abbrev = 'NY'
CREATE OR REPLACE FUNCTION aro.load_shard_towers(scoped_source_table text, target_schema text, state_abbrev text)
RETURNS integer AS $records_loaded_count$
DECLARE
  records_loaded_count int;
  target_table text;
  scoped_target_table text;
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
  target_table := 'towers';
  location_table := 'locations';
  records_loaded_count := 0;

  state_name := lower(state_abbrev);
  state_name_upper := upper(state_abbrev) ;
  scoped_target_table := target_schema || '.' || target_table || '_' || state_name;
  scoped_location_table := target_schema || '.' || location_table || '_' || state_name;
  missing_entities_index := target_schema || '_temp_missing_' || target_table || '_' || state_name;
  missing_entities_table := target_schema || '.temp_missing_' || target_table || '_' || state_name;

  RAISE NOTICE 'CREATING MISSING ENTITIES TABLE FOR %', state_abbrev;

  EXECUTE 'DROP TABLE IF EXISTS ' || missing_entities_table || ';';
  missing_expr :=
  'CREATE TABLE ' || missing_entities_table || ' as 
    select min(sita_number) as id, array_agg(sita_number) as sita_numbers, latitude, longitude, 
    ST_SetSRID(ST_Point(t.longitude, t.latitude),4326) as geom,
    ST_SetSRID(ST_Point(t.longitude, t.latitude),4326)::geography as geog,
    ST_Buffer(ST_SetSRID(ST_Point(t.longitude, t.latitude),4326)::geography, 15)::geography as buffer
    from ref_towers.sita_towers t
    WHERE sita_number !~ ''[^0-9]''
      AND (latitude != 0 AND longitude != 0)
      AND latitude != longitude
      AND parcel_state = ''' || state_name_upper || ''' 
    group by latitude, longitude ;';

  EXECUTE missing_expr;

  EXECUTE 'CREATE INDEX  tmp_' || missing_entities_index || '_buffer_gist ON ' || missing_entities_table || ' USING gist(buffer);';
 
  update_expr := 'WITH matching_locations AS
(
    SELECT
        l.id AS location_id,
        pl.id AS tower_location_id,
        ST_Distance(pl.geog, l.geog) AS distance
    FROM ' || missing_entities_table || ' pl
    JOIN ' || scoped_location_table || ' l ON st_intersects(pl.buffer, l.geog)
)
,
exact_locations AS
(
    SELECT
        tower_location_id,
        min(distance) AS min_distance
    FROM matching_locations
    GROUP BY tower_location_id
)
,
locations_matched as (
    SELECT
        ml.location_id,
        el.tower_location_id
    FROM exact_locations el
    JOIN matching_locations ml
    ON ml.tower_location_id = el.tower_location_id AND el.min_distance = ml.distance
)
,
missing_locations as (
        SELECT
            ul.id            
        FROM ' || missing_entities_table || ' ul
        LEFT JOIN locations_matched plm ON plm.tower_location_id = ul.id
        WHERE plm.location_id IS NULL
)
,
new_locations AS
(
    INSERT INTO ' || scoped_location_table || '(address, city, state, zipcode, lat, lon, geom, geog)
        SELECT
            pl.parcel_address,
            pl.parcel_city,
            pl.parcel_state,
            000000,
            pl.latitude,
            pl.longitude,
            ST_SetSRID(ST_Point(longitude, latitude), 4326) as geom,
            ST_SetSRID(ST_Point(longitude, latitude), 4326)::geography AS geog
        FROM ' || scoped_source_table || ' pl
        JOIN ' || missing_entities_table || ' ml on ml.id = pl.sita_number
        RETURNING id, lat, lon
)
,
mapped_entity_location as (
    select m.sita_numbers, m.location_id, geog, geom from (
    (select ul.sita_numbers, nl.id as location_id, geog, geom
    from new_locations nl
    join ' || missing_entities_table || ' ul on nl.lat = ul.latitude and nl.lon = ul.longitude)

    union 

    (select ul.sita_numbers, ml.location_id, geog, geom
    from locations_matched ml 
    join ' || missing_entities_table || ' ul on ul.id = ml.tower_location_id)) m
)
,
updated_towers as (
    insert into ' || scoped_source_table || ' (location_id, sita_number, parcel_address, parcel_city, parcel_state, lat, lon, geog, geom)
    (
        select
        mel.location_id,
        sita_number::int8,
        parcel_address, parcel_city,
        parcel_state,
        latitude,
        longitude,
        geog,
        geom
        from ' || scoped_source_table || ' t
        join mapped_entity_location mel on t.sita_number = any(mel.sita_numbers)
    )
    returning id, location_id
)
select count(*) from updated_towers ;';

  RAISE NOTICE 'MATCHING BUSINESSES TO LOCATIONS FOR %', state_abbrev;
  EXECUTE update_expr;

  RAISE NOTICE 'DROPPING MISSING ENTITIES TABLE FOR %', state_abbrev;
  EXECUTE 'DROP TABLE ' || missing_entities_table || ';';
  
  RETURN records_loaded_count;
END;
$records_loaded_count$ LANGUAGE plpgsql;
