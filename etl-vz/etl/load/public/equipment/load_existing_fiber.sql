TRUNCATE client.existing_fiber CASCADE;

INSERT INTO client.existing_fiber(source_fiber_segment_id, source_name, geom, edge_intersect_buffer_geom)
	SELECT
		id,
		'Geotel',
		the_geom,
		st_multi(st_transform(st_buffer(the_geom::geography, 20)::geometry, 4326))
	FROM geotel.fiber_plant 
	WHERE carrier = 'ZAYO';