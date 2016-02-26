package com.altvil.aro.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.altvil.aro.model.NetworkPlan;

public interface NetworkPlanRepository  extends JpaRepository<NetworkPlan, Integer>  {

	@Query(value = "with linked_locations as (\n" + 
			"SELECT\n" + 
			"l.id as id,\n" + 
			"l.geom as point,\n" + 
			"(SELECT gid \n" + 
			"FROM ( SELECT aro.edges.gid, ST_Distance(aro.edges.geom::geography, l.geom::geography) AS distance \n" + 
			"FROM aro.edges where st_intersects(r.area_bounds, aro.edges.geom) ORDER BY l.geom <#> aro.edges.geom LIMIT 5 ) AS index_query ORDER BY distance LIMIT 1\n" + 
			") as gid\n" + 
			"FROM\n" + 
			"aro.locations l\n" + 
			"join client.plan_targets pt on pt.location_id = l.id\n" + 
			"join client.plan r on r.id = pt.plan_id\n" + 
			"where r.id = :planId\n" + 
			")\n" + 
			"select\n" + 
			"ll.id as location_id,\n" + 
			"ll.gid,\n" + 
			"e.tlid,\n" + 
			"ll.point::point as location_point,\n" + 
			"st_line_locate_point(st_linemerge(e.geom), ll.point) as intersect_position,\n" + 
			"st_closestpoint(st_linemerge(e.geom), ll.point)::point as intersect_point,\n" + 
			"st_distance(ll.point::geography, st_closestpoint(e.geom, ll.point)::geography) as distance \n" + 
			"from linked_locations ll\n" + 
			"join aro.edges e on e.gid = ll.gid\n" + 
			"order by gid, intersect_position limit 40000", nativeQuery = true)
	List<List<Object>> queryLinkedLocations(@Param("planId") long planId);

	
	@Query(value = "\n" + 
			"with nodes as (\n" + 
			"		SELECT\n" + 
			"			n.id,\n" + 
			"			n.node_type_id" +
			"			n.geom,\n" + 
			"			w.location_edge_buffer as buffer_geom\n" + 
			"			FROM\n" + 
			"				client.plan p\n" + 
			"				join client.network_nodes n on p.id = n.plan_id and n.node_type_id = 1 \n" + 
			"				join aro.wirecenters w on w.id = p.wirecenter_id\n" + 
			"			WHERE \n" + 
			"				p.id = :planId\n" + 
			"			limit 40 \n" + 
			"		)\n" + 
			"		, \n" + 
			"		linked_nodes as (\n" + 
			"			SELECT\n" + 
			"			l.id,\n" + 
			"			l.geom as point,\n" + 
			"			-- First retrieve the 5 closest edges to each network_cos, using index-based bounding box search.\n" + 
			"			-- Then measure geographic distance to each (spheroid calcualtion) and find the closest.\n" + 
			"			-- Draw line connecting network_cos to edge.\n" + 
			"			(SELECT gid\n" + 
			"				FROM ( SELECT  aro.edges.gid, ST_Distance(aro.edges.geom::geography, l.geom::geography) AS distance\n" + 
			"					  FROM aro.edges where st_intersects(l.buffer_geom, aro.edges.geom) ORDER BY l.geom <#> aro.edges.geom LIMIT 5 ) AS index_query ORDER BY distance LIMIT 1\n" + 
			"			) as gid\n" + 
			"			FROM nodes l\n" + 
			"		)\n" + 
			"		SELECT \n" + 
			"			ll.id,\n" +
			"			ll.gid,\n" + 
			"			e.tlid,\n" + 
			"			ll.point::point,\n" + 
			"			st_line_locate_point(st_linemerge(e.geom), ll.point) as intersect_position,\n" + 
			"			st_closestpoint(st_linemerge(e.geom), ll.point)::point as intersect_point,\n" + 
			"			st_distance(ll.point::geography, st_closestpoint(e.geom, ll.point)::geography) as distance\n" + 
			"			ll.node_type_id" +
			"		FROM linked_nodes ll\n" + 
			"		JOIN  aro.edges  e on e.gid = ll.gid\n" + 
			"		ORDER BY gid, intersect_position\n" + 
			"		limit 20", nativeQuery = true)
	List<List<Object>> querySourceLocations(@Param("planId") long planId);
	
	
	@Query(value = "select  a.gid,  a.tlid, a.tnidf,  a.tnidt, st_astext(st_linemerge(a.geom)), edge_length\n" + 
			"from client.plan r \n" + 
			"join aro.wirecenters w on r.wirecenter_id = w.id\n" + 
			"join aro.edges a on st_intersects(edge_buffer, a.geom)\n" + 
			"where r.id = :planId", nativeQuery = true)
	List<List<Object>> queryRoadEdgesbyPlanId(@Param("planId") long planId);

	
	
}
