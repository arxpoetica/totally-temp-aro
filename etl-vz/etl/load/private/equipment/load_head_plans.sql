-- Creates Head Plan where not defined
WITH plan_heads AS (
	SELECT p.wirecenter_id
	FROM client.plan p
	WHERE p.plan_type = 'H'
)
,
missing_plan_heads AS (
	SELECT sa.id
	FROM client.service_area sa
	LEFT JOIN plan_heads p
		ON p.wirecenter_id = sa.id
	WHERE p.wirecenter_id IS NULL
)
,
new_plans AS (
INSERT INTO client.plan (service_layer_id, name, plan_type, parent_plan_id, wirecenter_id, area_name, area_centroid, area_bounds, created_at, updated_at)
SELECT
	sa.service_layer_id,
	'root_' || code,
	'H',
	NULL,
	sa.id,
	sa.code,
	st_centroid(geom),
	sa.geom,
	NOW(),
	NOW()
FROM client.service_area sa
JOIN missing_plan_heads m
	ON m.id = sa.id
ORDER BY sa.id
RETURNING  id, wirecenter_id, area_centroid
)
SELECT COUNT(*)
FROM new_plans ;