-- load_service_areas
-- This will only Load Missing Service Areas
WITH all_service_areas AS (
	SELECT
		w.gid,
		l.id AS service_layer_id,
		w.gid::varchar AS source_id
	FROM geotel.wirecenters w, client.service_layer l
	ORDER BY service_layer_id, w.gid
)
,
missing_service_areas AS (
	SELECT
		w.gid,
		w.service_layer_id
	FROM all_service_areas w
	LEFT JOIN client.service_area sa
		ON sa.source_id = w.source_id
		AND sa.service_layer_id = w.service_layer_id
	WHERE sa.id IS NULL
)
,
inserted_service_area AS (
	INSERT INTO client.service_area (service_layer_id, service_type, source_id, state, code, geog, geom, edge_buffer, location_edge_buffer)
	SELECT
		m.service_layer_id,
		'A',
		w.gid::varchar,
		w.state,
		w.wirecenter,
		Geography(ST_Force_2D(the_geom)) as geog, -- Use ST_FORce_2D because the source shapefiles have geometry type MultiLineStringZ...
		ST_Force_2D(the_geom) AS geom, -- Use ST_FORce_2D because the source shapefiles have geometry type MultiLineStringZ...
		ST_Transform(ST_buffer(ST_Convexhull(the_geom)::Geography, 200)::Geometry, 4326),
		ST_Transform(ST_buffer(ST_Convexhull(the_geom)::Geography, 50)::Geometry, 4326)  
	FROM geotel.wirecenters w
	JOIN missing_service_areas m
		ON m.gid = w.gid
	RETURNING id, service_layer_id
)
select count(*) from inserted_service_area ;