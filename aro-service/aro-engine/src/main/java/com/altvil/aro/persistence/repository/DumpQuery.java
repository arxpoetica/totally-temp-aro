package com.altvil.aro.persistence.repository;

public class DumpQuery {
	
	private static String QUERY  = "\n"
			+ "with nodes as (\n"
			+ "		SELECT\n"
			+ "			n.id,\n"
			+ "			n.node_type_id"
			+ "			n.geom,\n"
			+ "			w.location_edge_buffer as buffer_geom\n"
			+ "			FROM\n"
			+ "				client.plan p\n"
			+ "				join client.network_nodes n on p.id = n.plan_id and n.node_type_id = 1 \n"
			+ "				join aro.wirecenters w on w.id = p.wirecenter_id\n"
			+ "			WHERE \n"
			+ "				p.id = :planId\n"
			+ "			limit 40 \n"
			+ "		)\n"
			+ "		, \n"
			+ "		linked_nodes as (\n"
			+ "			SELECT\n"
			+ "			l.id,\n"
			+ "			l.geom as point,\n"
			+ "			-- First retrieve the 5 closest edges to each network_cos, using index-based bounding box search.\n"
			+ "			-- Then measure geographic distance to each (spheroid calcualtion) and find the closest.\n"
			+ "			-- Draw line connecting network_cos to edge.\n"
			+ "			(SELECT gid\n"
			+ "				FROM ( SELECT  aro.edges.gid, ST_Distance(cast(aro.edges.geom as geography), cast(l.geom as geography)) AS distance\n"
			+ "					  FROM aro.edges where st_intersects(l.buffer_geom, aro.edges.geom) ORDER BY l.geom <#> aro.edges.geom LIMIT 5 ) AS index_query ORDER BY distance LIMIT 1\n"
			+ "			) as gid\n"
			+ "			FROM nodes l\n"
			+ "		)\n"
			+ "		SELECT \n"
			+ "			ll.id,\n"
			+ "			ll.gid,\n"
			+ "			e.tlid,\n"
			+ "			st_asttext(ll.point),\n"
			+ "			st_line_locate_point(st_linemerge(e.geom), ll.point) as intersect_position,\n"
			+ "			st_astext(st_closestpoint(cast(st_linemerge(e.geom), ll.point) as point)) as intersect_point,\n"
			+ "			st_distance(cast(ll.point as geography), cast(st_closestpoint(e.geom, ll.point) as geography)) as distance\n"
			+ "			ll.node_type_id" + "		FROM linked_nodes ll\n"
			+ "		JOIN  aro.edges  e on e.gid = ll.gid\n"
			+ "		ORDER BY gid, intersect_position\n	limit 20" ;
	
	
	public static void main(String[] args) {
		System.out.println(QUERY) ;
	}
	

}
