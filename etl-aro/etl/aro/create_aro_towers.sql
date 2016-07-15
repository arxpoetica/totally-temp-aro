--CREATE ARO.TOWERS Linked to Locations
DROP TABLE IF EXISTS aro.towers;
CREATE TABLE aro.towers
(
	id serial,
	location_id int4 references aro.locations,
	sita_number bigint,
	parcel_address varchar,
	parcel_city varchar,
	parcel_state varchar,
	lat double precision,
	lon double precision,
	geog geography(POINT, 4326),
	CONSTRAINT aro_towers_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'towers', 'geom', 4326, 'POINT', 2);

with unique_wa_towers as
(
    select
        distinct ST_SetSRID(ST_MakePoint(lon, lat), 4326) as geom,
        city,
        lat,
        lon,
        ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography as geog
    from sita.vz_wa_towers
)
insert into aro.locations(city, lat, lon, geom, geog)
    select 
        city,
        lat,
        lon, 
        geom,
        geog
    from unique_wa_towers;

-- load wa towers
insert into aro.towers(location_id, parcel_state, parcel_city, lat, lon, geom, geog)
	SELECT
		l.id,
		t.location_type,
		t.city,
		t.lat,
		t.lon,
		ST_SetSRID(ST_MakePoint(t.lon, t.lat), 4326),
		ST_SetSRID(ST_MakePoint(t.lon, t.lat), 4326)::geography
	from sita.vz_wa_towers t
	join aro.locations l
	on st_equals(l.geom, ST_SetSRID(ST_MakePoint(t.lon, t.lat), 4326))
	join aro.wirecenters wc
	on st_contains(wc.geom, l.geom)
	where wc.state = 'WA';


-----
--NOT USING SITA TOWERS FOR THIS ANALYSIS
----

-- --track unqiue locations and index geometry
-- DROP TABLE IF EXISTS aro.unique_locations ;
-- CREATE TABLE aro.unique_locations as 
-- 	select min(sita_number) as id, array_agg(sita_number) as sita_numbers, latitude, longitude, 
-- 	ST_SetSRID(ST_Point(t.longitude, t.latitude),4326) as geom,
-- 	ST_SetSRID(ST_Point(t.longitude, t.latitude),4326)::geography as geog,
-- 	ST_Buffer(ST_SetSRID(ST_Point(t.longitude, t.latitude),4326)::geography, 15)::geography as buffer
-- 	from sita.towers t
-- 	--Filter Invalid Towers
-- 	WHERE sita_number !~ '[^0-9]'
--   	AND (latitude != 0 AND longitude != 0)
--   	AND latitude != longitude
--   	--Filter for NY
--   	AND parcel_state = 'OH' -- Only do NY state for now, since all the other dev data is there.
--   	OR parcel_state = 'WA'
-- 	group by latitude, longitude ;

-- create index aro_unique_locations on aro.unique_locations using gist (buffer) ;

-- with matching_locations AS
-- (
-- 	SELECT
-- 		l.id AS location_id,
-- 		pl.id AS tower_location_id,
-- 		ST_Distance(pl.geog, l.geog) AS distance
-- 	FROM aro.unique_locations pl
-- 	JOIN aro.locations l ON st_intersects(pl.buffer, l.geog)
-- )
-- ,
-- exact_locations AS
-- (
-- 	SELECT
-- 		tower_location_id,
-- 		min(distance) AS min_distance
-- 	FROM matching_locations
-- 	GROUP BY tower_location_id
-- )
-- ,
-- locations_matched as (
-- 	SELECT
-- 		ml.location_id,
-- 		el.tower_location_id
-- 	FROM exact_locations el
-- 	JOIN matching_locations ml
-- 	ON ml.tower_location_id = el.tower_location_id AND el.min_distance = ml.distance
-- )
-- ,
-- missing_locations as (
-- 		SELECT
-- 			ul.id			
-- 		FROM aro.unique_locations ul
-- 		LEFT JOIN locations_matched plm ON plm.tower_location_id = ul.id
-- 		WHERE plm.location_id IS NULL
-- )
-- ,
-- new_locations AS
-- (
-- 	INSERT INTO aro.locations(address, city, state, zipcode, lat, lon, geom, geog)
-- 		SELECT
-- 			pl.parcel_address,
-- 			pl.parcel_city,
-- 			pl.parcel_state,
-- 			000000,
-- 			pl.latitude,
-- 			pl.longitude,
-- 			ST_SetSRID(ST_Point(longitude, latitude), 4326) as geom,
-- 			ST_SetSRID(ST_Point(longitude, latitude), 4326)::geography AS geog
-- 		FROM sita.towers pl
-- 		JOIN missing_locations ml on ml.id = pl.sita_number
-- 		RETURNING id, lat, lon
-- )
-- ,
-- mapped_entity_location as (
-- 	select m.sita_numbers, m.location_id, geog, geom from (
-- 	(select ul.sita_numbers, nl.id as location_id, geog, geom
-- 	from new_locations nl
-- 	join aro.unique_locations ul on nl.lat = ul.latitude and nl.lon = ul.longitude)

-- 	union 

-- 	(select ul.sita_numbers, ml.location_id, geog, geom
-- 	from locations_matched ml 
-- 	join aro.unique_locations ul on ul.id = ml.tower_location_id)) m
-- )
-- ,
-- updated_towers as (
-- 	insert into aro.towers (location_id, sita_number, parcel_address, parcel_city, parcel_state, lat, lon, geog, geom)
-- 	(
-- 		select
-- 		mel.location_id, sita_number::int8, parcel_address, parcel_city, parcel_state, latitude, longitude,
-- 		geog,
-- 		geom
-- 		from sita.towers t
-- 		join mapped_entity_location mel on t.sita_number = any(mel.sita_numbers)
-- 	)
-- 	returning id, location_id
-- )
-- select count(*) from updated_towers ;

-- --Clean up UNIQUE_LOCATIONS TAble
-- DROP TABLE aro.unique_locations ;

