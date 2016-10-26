TRUNCATE client.existing_fiber CASCADE;

INSERT INTO client.existing_fiber(source_fiber_segment_id, source_name, is_partner_carrier, geom, edge_intersect_buffer_geom)
	SELECT
		id,
		source,
		is_partner_carrier,
		geom,
		st_multi(st_transform(st_buffer(geom::geography, 20)::geometry, 4326))
	FROM network_equipment.fiber;
