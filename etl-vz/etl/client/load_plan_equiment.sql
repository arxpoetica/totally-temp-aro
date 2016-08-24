WITH new_plans AS (
INSERT INTO client.plan (name, plan_type, parent_plan_id, wirecenter_id, area_name, area_centroid, area_bounds, created_at, updated_at)
SELECT
	'root_' || code,
	'H',
	NULL,
	id,
	code,
	st_centroid(geom),
	geom,
	NOW(),
	NOW()
FROM client.service_area
ORDER BY id
RETURNING  id, wirecenter_id, area_centroid
)
,
new_cos as (
	INSERT INTO client.network_nodes (plan_id, node_type_id, geog, geom)
	SELECT
		id, 1, area_centroid::geography, area_centroid
	FROM new_plans
)
,
new_heads as (
	INSERT INTO client.plan_head (created_on, updated_on, plan_id, service_area_id)
	SELECT
		NOW(),
		NOW(),
		id, 
		wirecenter_id
	FROM new_plans
	ORDER BY id
	RETURNING id
)
select count (*) from new_heads ;