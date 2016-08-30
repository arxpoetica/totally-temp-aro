-- Insert Equipment Where Not defined
WITH missing_equipment_service AS (	
	SELECT p.id
	FROM client.service_layer l, 
		client.plan p
	LEFT JOIN client.network_nodes n 
		ON n.plan_id = p.id
		AND n.node_type_id = 1
	WHERE p.plan_type = 'H'
	AND n.id IS NULL
)
,
new_cos as (
	INSERT INTO client.network_nodes (plan_id, node_type_id, geog, geom)
	SELECT
		p.id, 1,p. area_centroid::geography, p.area_centroid
	FROM client.plan p
	JOIN missing_equipment_service m
		ON m.id = p.id 
	RETURNING id
)
select count(*) from new_cos ;

