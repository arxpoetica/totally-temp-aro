INSERT INTO client.service_area_assignment 
	(service_layer_id, service_area_id, analysis_area_id, geom, area_m2, is_primary)
WITH intersected_areas AS (
	SELECT sa.service_layer_id,
			sa.id,
			aa.id AS analysis_area_id,
			ST_INTERSECTION(aa.geom,sa.geom) as geom,
			ST_AREA(ST_INTERSECTION(aa.geom,sa.geom)::geography) AS area  
	FROM client.service_area sa 
	JOIN client.service_area aa ON ST_CONTAINS(aa.geom,sa.geom) and sa.service_type = 'A' and aa.service_type='S'
)
,
max_areas AS (
	SELECT a.id, MAX(area) as area
	FROM intersected_areas a
	GROUP BY a.id
)
SELECT 
	a.service_layer_id,
	a.id as service_area_id,
	a.analysis_area_id,
	a.geom, a.area,
	CASE WHEN ma IS NULL THEN false ELSE true END
FROM intersected_areas a
LEFT JOIN max_areas ma ON ma.id = a.id AND ma.area = a.area  ;