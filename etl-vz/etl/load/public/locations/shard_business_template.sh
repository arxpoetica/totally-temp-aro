#!/bin/bash
set -e;


DO $$
DECLARE
    all_states text[][] := array[['NY', '36'], ['WA', '53']];
    state text[];
    state_name text ;
    current_table text;

BEGIN
    
    FOREACH state SLICE 1 IN ARRAY all_states
    LOOP

        state_name := lower(state[1]);
       
        RAISE NOTICE '*************************';
        RAISE NOTICE '*** LOAD BUSINESSES STATE: %', state_name;

        source_table :=     'ref_businesses_data.infousa_' || state_name || ';';
        target_table :=     'aro_location_data.infousa_' || state_name || ';';
        location_table :=   'aro_location_data.location_' || state_name|| ';' ;
        missing_entities := 'aro_location_data.temp_missing_business_' || state_name || ';'

    Execute 'CREATE TABLE ' || target_table  || '(CHECK (state =  ' || state_name || ')) INHERITS (aro.businesses);';

    String missing_expr := 'INSERT INTO  ' || missing_entities || ' AS     
    SELECT 
        sourceid as source_id, 
        ST_BUFFER(ST_MakePoint(long, lat)::geography, 5)::geoemtery as buffer
    FROM ' || source_table || ' st
    LEFT JOIN ' || target_table || 'tt
        ON st.sourceid =  tt.source_id
    WHERE tt.id IS NULL ;';

    Execute missing_expr ;

    Execute 'CREATE INDEX  tmp_' || missing_entities || '_buffer_gist ON ' || missing_entities || ' USING gist(buffer);';
    Execute 'CREATE INDEX  tmp_' || missing_entities || '_buffer_source_id ON ' || missing_entities || ' USING btree(source_id);';

    String update_expr := 'WITH matched_locations AS (
    SELECT
       mb.source_id,
       dl.id AS location_id
    FROM ${missing_entities} me
    JOIN ' || location_table ' l
        ON ST_Contains(me.buffer, l.geom) ; 
    ),
    missing_locations AS (
        SELECT
            me.source_id,
            select nextval("'"locations_id_seq"'"::regclass) AS loction_id
        FROM ' || missing_entities || 'me,
        LEFT JOIN matched_locations ml
            ON ml.source_id = me.source_id
        WHERE ml.source_id IS NULL
    ),
    new_locations AS
    (
        INSERT INTO ' || location_table || ' (id, address, city, state, zipcode, lat, lon, geom, geog)
            SELECT
                ml.location_id,
                e.address,
                e.city,
                e.state,
                e.zip, 
                e.lat,
                e.long,
                ST_SetSRID(ST_Point(long, lat), 4326),
                ST_SetSRID(ST_Point(long, lat), 4326)::geography
            FROM ' || source_table  || ' e
            JOIN missing_locations ml
                ON ml.id = e.sourceid
            RETURNING id
    ),
    matched_entities AS (
        SELECT location_id, source_id FROM matched_locations

        UNION

        SELECT location_id, source_id FROM missing_locations
    )
    ,
    updated_entities AS (
         INSERT INTO  ' || target_table || ' (location_id, source_id, industry_id, name, address, number_of_employees, geog, geom)
            SELECT  
                me.location_id,
                me.source_id,
                e.sic4,
                e.business,
                e.address,
                e.city,
                e.emps,
                e.geog,
                e.geog::geometry
            FROM  ' || source_table || ' e
            JOIN matched_entities me
                ON me.source_id = b.source_id
    )
    DROP TABLE ' || missing_entities || ';';

    Execute 'CREATE INDEX ' || target_table || '_location_index ON aro.businesses(location_id);';
    Execute 'CREATE INDEX ' || target_table || '_industry_index ON aro.businesses(industry_id);';
    Execute 'CREATE INDEX ' || target_table || '_geog_index ON aro.businesses USING gist(geog);';
    Execute 'CREATE INDEX ' || target_table || '_geom_index ON aro.businesses USING gist(geom);';

 END LOOP;
END$$;