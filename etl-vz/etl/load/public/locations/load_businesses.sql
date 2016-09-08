--TODO Add source_id varchar to Businesses
--TODO find rule to calculate source_id for example <SOURCE>:<ID>


--IDENTIFY ALL Business that need to be INSERTED


DO $$
DECLARE
    all_states text[][] := array[['NY', '36'], ['WA', '53']];
    state text[];
    state_name text ;
    current_table text;

BEGIN
    
    -- Loop for creating partitioned subtables
    FOREACH state SLICE 1 IN ARRAY all_states
    LOOP

        state_name := lower(state[1]);
       
        RAISE NOTICE '*************************';
        RAISE NOTICE '*** CURRENT STATE: %', state_name;

        source_table :=  'ref_businesses_data.infousa_' || state_name || ';';
        target_table := 'aro_businesses_data.infousa_' || state_name || ';';
        location_table := 'aro_businesses_data.location_' || state_name|| ';' ;
        missing_entities := 'aro_businesses_data.temp_missing_business_' || state_name || ';'

Execute 'CREATE TABLE ' || target_table  || '(CHECK (state =  ' || state_name || ')) INHERITS (aro.businesses);';

String expr := 'INSERT INTO  ' || missing_entities || ' AS     
SELECT 
    sourceid as source_id, 
    ST_BUFFER(ST_MakePoint(long, lat)::geography, 5)::geoemtery as buffer
FROM ' || source_table || ' st
LEFT JOIN ' || target_table || 'tt
    ON st.sourceid =  tt.source_id
WHERE tt.id IS NULL ;';

Execute expr ;

Execute 'CREATE INDEX  tmp_' || missing_entities || '_buffer_gist ON ' || missing_entities || ' USING gist(buffer);';
Execute 'CREATE INDEX  tmp_' || missing_entities || '_buffer_source_id ON ' || missing_entities || ' USING btree(source_id);';

-- FUZZY Match Existing locations
 expr := 'WITH matched_locations AS (
    SELECT
       mb.source_id,
       dl.id AS location_id
    FROM ${missing_entities} me
    JOIN ' || location_table ' l
        ON ST_Contains(me.buffer, l.geom) ; 
),
-- Match Locations that need to be updated (Note location_id assigned here)
missing_locations AS (
    SELECT
        me.source_id,
        select nextval(\'locations_id_seq\'::regclass) AS loction_id
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

Execute 'CREATE_INDEX CREATE INDEX ' || target_table || '_location_index ON aro.businesses(location_id);
CREATE INDEX aro_businesses_industry_index ON aro.businesses(industry_id);
CREATE INDEX aro_businesses_geog_index ON aro.businesses USING gist(geog);
CREATE INDEX aro_businesses_geom_index ON aro.businesses USING gist(geom);


-- Make locations out of InfoUSA businesses (infousa.businesses)
INSERT INTO aro.locations(address, city, state, zipcode, lat, lon, geog, geom)
    SELECT DISTINCT ON (bldgid)
        address,
        city,
        b.state,
        zip AS zipcode,
        lat,
        long AS lon,
        b.geog as geog,
        b.geog::geometry as geom
    FROM project_constraints.spatial wc,
        ref_businesses.infousa b
    WHERE ST_Contains(wc.geom, b.geog::geometry);

INSERT INTO aro.businesses(location_id, industry_id, name, address, number_of_employees, geog, geom)
	SELECT
		l.id AS location_id,
		b.sic4 AS industry_id,
		b.business AS name,
		b.address AS address,
		b.emps AS number_of_employees,
		b.geog AS geog,
		b.geog::geometry AS geom
	FROM ref_businesses.infousa b
	JOIN aro.locations l
		ON ST_Equals(l.geom, b.geog::geometry);






