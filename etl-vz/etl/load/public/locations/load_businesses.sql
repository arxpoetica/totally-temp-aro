DO $$
DECLARE
    all_states text[][] := array[['NY', '36'], ['WA', '53']];
    state text[];
    current_locations_table text;
    current_entities_table text;
    current_unique_table text;
    current_source_table text;
    expr text;

BEGIN
    
    -- Loop for creating partitioned subtables
    FOREACH state SLICE 1 IN ARRAY all_states
    LOOP
        current_locations_table := 'aro_data.locations_' || lower(state[1]);
        current_entities_table := 'aro_data.businesses_' || lower(state[1]);
        current_unique_table := 'aro_data.unique_locations_' || lower(state[1]);
        current_source_table := 'ref_businesses_data.infousa_' || lower(state[1]);
        current_loc_biz_table := 'aro_data.loc_biz_' || lower(state[1]);

        RAISE NOTICE '**** CREATING UNIQUE LOCATIONS FOR: %', state[1];

        EXECUTE 'DROP TABLE IF EXISTS ' || current_unique_table;
        expr := 'CREATE TABLE ' || current_unique_table || ' AS 
            SELECT
                sourceid AS id,
                lat,
                long,
                ST_SetSRID(ST_Point(long, lat), 4326) AS geom,
                ST_SetSRID(ST_Point(long, lat), 4326)::geography AS geog,
                ST_Buffer(ST_SetSRID(ST_Point(long, lat),4326)::geography, 15)::geography as buffer
            FROM ' || current_source_table || ';';
        EXECUTE expr;

        EXECUTE 'CREATE INDEX aro_data_unique_locations_' || lower(state[1]) || '_buffer_idx ON ' || current_unique_table || ' USING gist (buffer)';

        RAISE NOTICE '**** CREATING LOC/BIZ MATCHING TABLE ****';
        EXECUTE 'DROP TABLE IF EXISTS ' || current_loc_biz_table;
        EXECUTE 'CREATE TABLE ' || current_loc_biz_table || ' (location_id int, business_id int);';

        expr := 'WITH matching_locations AS 
        (
            SELECT
                l.id AS location_id,
                ul.id AS business_location_id,
                ST_Distance(ul.geog, l.geog) AS distance
            FROM ' || current_unique_table || ' ul 
            JOIN ' || current_locations_table || '  l 
                ON ST_Intersects(ul.buffer, l.geog)
        ),
        exact_locations AS
        (
            SELECT
                business_location_id,
                min(distance) as min_distance
            FROM matching_locations
            GROUP BY business_location_id
        ),
        locations_matched AS
        (
            SELECT
                ml.location_id,
                el.business_location_id
            FROM exact_locations el
            JOIN matching_locations ml
                ON ml.business_location_id = el.business_location_id AND el.min_distance = ml.distance
        ),
        missing_locations AS
        (
            SELECT 
                ul.id
            FROM ' || current_unique_table || ' ul
            LEFT JOIN locations_matched lm 
                ON lm.business_location_id = ul.id
            WHERE lm.location_id IS NULL 
        ),
        assigned_locations AS
        (
            SELECT
                ml.id AS business_id,
                nextval('x') AS location_id
            FROM missing_locations m
        )
-- SELECT NEXTVAL FROM LOCATIONS TABLE, BUSINESS_ID
        new_locations AS
        (
            INSERT INTO ' || current_locations_table || '(address, city, state, zipcode, lat, lon, geom, geog)
                SELECT
                    b.address,
                    b.city,
                    b.state,
                    b.zip, 
                    b.lat,
                    b.long,
                    ST_SetSRID(ST_Point(long, lat), 4326),
                    ST_SetSRID(ST_Point(long, lat), 4326)::geography
                FROM ' || current_source_table ' b
                JOIN missing_locations ml on ml.id = b.sourceid
                RETURNING id, lat, lon 
        ),
        mapped_entity_location AS
        (
            SELECT
                m.location_id,
                geog,
                geom
            FROM (
                (
                SELECT 
                    nl.id AS location_id, 
                    geog, 
                    geom
                FROM new_locations nl
                JOIN ' || current_unique_table || ' ul
                ON nl.lat = ul.lat AND nl.lon = ul.long
                )
                
                UNION

                (
                SELECT
                    lm.location_id,
                    geog,
                    geom
                FROM locations_matched lm
                JOIN ' || current_unique_table || ' ul
                ON ul.id = lm.business_location_id
                )
            ) m
        ),
        updated_businesses AS
        (
            INSERT INTO ' || current_entities_table || '(location_id, industry_id, name, address, number_of_employees, geog, geom)
                SELECT  
                    mel.location_id,
                    b.sic4,
                    b.business,
                    b.address,
                    b.city,
                    b.emps,
                    b.geog,
                    b.geog::geometry
                FROM ' || current_source_table ' b
                JOIN mapped_entity_location mel ON 


        )
        '

        --EXECUTE 'DROP TABLE IF EXISTS ' || current_unique_table;
        --EXECUTE 'DROP TABLE IF EXISTS ' || current_loc_biz_table;

    END LOOP;
END$$;