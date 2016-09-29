-- Insert Cran Equipment Where Not defined
WITH missing_equipment_service AS (	
	SELECT
		p.id,
		p.service_layer_id
	FROM client.plan p
	JOIN client.service_layer l
		ON l.id = p.service_layer_id
	LEFT JOIN client.network_nodes n 
		ON n.plan_id = p.id
		AND n.node_type_id = 1
	WHERE p.plan_type = 'H'
	AND l.name='cran'
	AND n.id IS NULL
)
,
new_cos as (
	INSERT INTO client.network_nodes (plan_id, node_type_id, geog, geom)
	SELECT
		p.id,
		(select t.id from client.network_node_types t where name = 'central_office' limit 1)::int, 
		h.geog,
		h.geom
	FROM  client.plan p
	JOIN missing_equipment_service m
		ON m.id = p.id 
	JOIN client.service_area sa
		ON sa.id = p.wirecenter_id 
	JOIN network_equipment.hubs h
		ON ST_Contains(sa.geom, h.geom) 
	RETURNING id
)
select count(*) from new_cos ;

-- Load directional_facility
WITH missing_equipment_service AS (	
	SELECT
		p.id,
		p.service_layer_id
	FROM client.plan p
	JOIN client.service_layer l
		ON l.id = p.service_layer_id
	LEFT JOIN client.network_nodes n 
		ON n.plan_id = p.id
		AND n.node_type_id = 1
	WHERE p.plan_type = 'H'
	AND l.name='directional_facility'
	AND n.id IS NULL
)
,
df_equipment AS (
	SELECT 
		longitude::varchar || latitude::varchar AS id,
		ST_SetSRID(ST_MakePoint(longitude, latitude),4326) AS geom 
	FROM network_equipment.directional_facilities
	WHERE longitude IS NOT NULL 
	AND latitude IS NOT NULL
	AND util_key_2012 != 'Duplicate'
	GROUP BY latitude, longitude
)
,
new_cos as (
	INSERT INTO client.network_nodes (plan_id, node_type_id, geog, geom)
	SELECT
		p.id,
		(select t.id from client.network_node_types t where name = 'central_office' limit 1)::int, 
		df.geom::geography,
		df.geom
	FROM  client.plan p
	JOIN missing_equipment_service m
		ON m.id = p.id 
	JOIN client.service_area sa
		ON sa.id = p.wirecenter_id 
	JOIN df_equipment df
		ON ST_Contains(sa.geom, df.geom) 
	RETURNING id
)
select count(*) from new_cos ;


-- Insert GeoTell Equipment Where Not defined
WITH missing_equipment_service AS (	
	SELECT p.id
	FROM client.plan p
	JOIN client.service_layer l
		ON l.id = p.service_layer_id
	LEFT JOIN client.network_nodes n 
		ON n.plan_id = p.id
		AND n.node_type_id = 1
	WHERE p.plan_type = 'H'
	AND l.name ='wirecenter'
	AND n.id IS NULL
)
,
new_cos as (
	INSERT INTO client.network_nodes (plan_id, node_type_id, geog, geom)
	SELECT
		p.id, 
		1,
		p.area_centroid::geography, 
		p.area_centroid
	FROM client.plan p
	JOIN missing_equipment_service m
		ON m.id = p.id 
	RETURNING id
)
select count(*) from new_cos ;

