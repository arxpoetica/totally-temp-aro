TRUNCATE aro.towers CASCADE ;

--track unqiue locations and index geometry
DROP TABLE IF EXISTS aro.unique_locations ;
CREATE TABLE aro.unique_locations as 
    select min(sita_number) as id, array_agg(sita_number) as sita_numbers, latitude, longitude, 
    ST_SetSRID(ST_Point(t.longitude, t.latitude),4326) as geom,
    ST_SetSRID(ST_Point(t.longitude, t.latitude),4326)::geography as geog,
    ST_Buffer(ST_SetSRID(ST_Point(t.longitude, t.latitude),4326)::geography, 15)::geography as buffer
    from ref_towers.sita_towers t
    --Filter Invalid Towers
    WHERE sita_number !~ '[^0-9]'
      AND (latitude != 0 AND longitude != 0)
      AND latitude != longitude
      --Filter for NY
      AND parcel_state = 'OH' -- Only do NY state for now, since all the other dev data is there.
      OR parcel_state = 'WA'
    group by latitude, longitude ;

create index aro_unique_locations on aro.unique_locations using gist (buffer) ;

with matching_locations AS
(
    SELECT
        l.id AS location_id,
        pl.id AS tower_location_id,
        ST_Distance(pl.geog, l.geog) AS distance
    FROM aro.unique_locations pl
    JOIN aro.locations l ON st_intersects(pl.buffer, l.geog)
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
        FROM aro.unique_locations ul
        LEFT JOIN locations_matched plm ON plm.tower_location_id = ul.id
        WHERE plm.location_id IS NULL
)
,
new_locations AS
(
    INSERT INTO aro.locations(address, city, state, zipcode, lat, lon, geom, geog)
        SELECT
            pl.parcel_address,
            pl.parcel_city,
            pl.parcel_state,
            000000,
            pl.latitude,
            pl.longitude,
            ST_SetSRID(ST_Point(longitude, latitude), 4326) as geom,
            ST_SetSRID(ST_Point(longitude, latitude), 4326)::geography AS geog
        FROM ref_towers.sita_towers pl
        JOIN missing_locations ml on ml.id = pl.sita_number
        RETURNING id, lat, lon
)
,
mapped_entity_location as (
    select m.sita_numbers, m.location_id, geog, geom from (
    (select ul.sita_numbers, nl.id as location_id, geog, geom
    from new_locations nl
    join aro.unique_locations ul on nl.lat = ul.latitude and nl.lon = ul.longitude)

    union 

    (select ul.sita_numbers, ml.location_id, geog, geom
    from locations_matched ml 
    join aro.unique_locations ul on ul.id = ml.tower_location_id)) m
)
,
updated_towers as (
    insert into aro.towers (location_id, sita_number, parcel_address, parcel_city, parcel_state, lat, lon, geog, geom)
    (
        select
        mel.location_id, sita_number::int8, parcel_address, parcel_city, parcel_state, latitude, longitude,
        geog,
        geom
        from ref_towers.sita_towers t
        join mapped_entity_location mel on t.sita_number = any(mel.sita_numbers)
    )
    returning id, location_id
)
select count(*) from updated_towers ;

--Clean up UNIQUE_LOCATIONS TAble
DROP TABLE aro.unique_locations ;