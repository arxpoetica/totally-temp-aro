package com.altvil.aro.persistence.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.NetworkPlan;

public interface NetworkPlanRepository extends
		JpaRepository<NetworkPlan, Long> {

	@Query(value = "with linked_locations as (\n"
			+ "SELECT\n"
			+ "l.id as id,\n"
			+ "l.geom as point,\n"
			+ "(SELECT gid \n"
			+ "FROM ( SELECT aro.edges.gid, ST_Distance(aro.edges.geom::geography, l.geom::geography) AS distance \n"
			+ "FROM aro.edges where st_intersects(r.area_bounds, aro.edges.geom) ORDER BY l.geom <#> aro.edges.geom LIMIT 5 ) AS index_query ORDER BY distance LIMIT 1\n"
			+ ") as gid\n"
			+ "FROM\n"
			+ "aro.locations l\n"
			+ "join client.plan_targets pt on pt.location_id = l.id\n"
			+ "join client.plan r on r.id = pt.plan_id\n"
			+ "where r.id = :planId\n"
			+ ")\n"
			+ "select\n"
			+ "ll.id as location_id,\n"
			+ "ll.gid,\n"
			+ "e.tlid,\n"
			+ "ll.point::point as location_point,\n"
			+ "st_line_locate_point(st_linemerge(e.geom), ll.point) as intersect_position,\n"
			+ "st_closestpoint(st_linemerge(e.geom), ll.point)::point as intersect_point,\n"
			+ "st_distance(ll.point::geography, st_closestpoint(e.geom, ll.point)::geography) as distance \n"
			+ "from linked_locations ll\n"
			+ "join aro.edges e on e.gid = ll.gid\n"
			+ "order by gid, intersect_position limit 40000", nativeQuery = true)
	List<List<Object>> queryLinkedLocations(@Param("planId") long planId);

	@Query(value = "\n"
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
			+ "				FROM ( SELECT  aro.edges.gid, ST_Distance(aro.edges.geom::geography, l.geom::geography) AS distance\n"
			+ "					  FROM aro.edges where st_intersects(l.buffer_geom, aro.edges.geom) ORDER BY l.geom <#> aro.edges.geom LIMIT 5 ) AS index_query ORDER BY distance LIMIT 1\n"
			+ "			) as gid\n"
			+ "			FROM nodes l\n"
			+ "		)\n"
			+ "		SELECT \n"
			+ "			ll.id,\n"
			+ "			ll.gid,\n"
			+ "			e.tlid,\n"
			+ "			ll.point::point,\n"
			+ "			st_line_locate_point(st_linemerge(e.geom), ll.point) as intersect_position,\n"
			+ "			st_closestpoint(st_linemerge(e.geom), ll.point)::point as intersect_point,\n"
			+ "			st_distance(ll.point::geography, st_closestpoint(e.geom, ll.point)::geography) as distance\n"
			+ "			ll.node_type_id" + "		FROM linked_nodes ll\n"
			+ "		JOIN  aro.edges  e on e.gid = ll.gid\n"
			+ "		ORDER BY gid, intersect_position\n" + "		limit 20", nativeQuery = true)
	List<List<Object>> querySourceLocations(@Param("planId") long planId);

	@Query(value = "select  a.gid,  a.tlid, a.tnidf,  a.tnidt, st_astext(st_linemerge(a.geom)), edge_length\n"
			+ "from client.plan r \n"
			+ "join aro.wirecenters w on r.wirecenter_id = w.id\n"
			+ "join aro.edges a on st_intersects(edge_buffer, a.geom)\n"
			+ "where r.id = :planId", nativeQuery = true)
	List<List<Object>> queryRoadEdgesbyPlanId(@Param("planId") long planId);

    @Modifying
    @Transactional
	@Query(value = ""
			+ "-- Root Master Plan\n"
			+ "with inputs as (\n"
			+ " select p.id as master_plan_id, p.* \n"
			+ " from client.plan p where p.id = :planId \n"
			+ ")\n"
			+ ",\n"
			+ "-- Derive Orginal Targets\n"
			+ "original_targets as (\n"
			+ " select pt.id, pt.location_id, pt.plan_id, mp.master_plan_id, wp.wirecenter_id\n"
			+ " from inputs mp\n"
			+ " join client.plan wp on wp.parent_plan_id = mp.id\n"
			+ " join client.plan_targets pt on pt.plan_id = wp.id\n"
			+ ")\n"
			+ ",\n"
			+ "-- Selected Targets Contains the set of all requested locations \n"
			+ "selected_targets as (\n"
			+ "	select mt.location_id, ot.plan_id, mp.master_plan_id, ot.wirecenter_id\n"
			+ "	from inputs mp\n"
			+ "	join client.plan_targets mt on mt.plan_id = mp.id and mt.plan_id = mp.id\n"
			+ "	left join original_targets ot on ot.location_id = mt.location_id \n"
			+ ")\n"
			+ ",\n"
			+ "-- New Targets (Selected_Targets - Original_Targets) given by Orginal_Target.plan_id is NULL\n"
			+ "new_targets as (\n"
			+ "	select st.location_id, st.master_plan_id, w.id as wirecenter_id  \n"
			+ "	from selected_targets st \n"
			+ "	join aro.locations l on l.id = st.location_id\n"
			+ "	join aro.wirecenters w on st_contains(w.geom, l.geom)\n"
			+ "	where st.plan_id is null\n"
			+ ")\n"
			+ ",\n"
			+ "-- Deleted Targets  = (Original_Targets - Selected_Targets) derived by anti-join\n"
			+ "deleted_locations as (\n"
			+ "	select ot.location_id, ot.plan_id, ot.master_plan_id, ot.wirecenter_id\n"
			+ "	from original_targets ot\n"
			+ "	left join selected_targets st on st.location_id = ot.location_id and st.plan_id = ot.plan_id\n"
			+ "	where st.location_id is null \n"
			+ ")\n"
			+ ",\n"
			+ "-- Reduce(new_targets) => New Plans\n"
			+ "new_plans as (\n"
			+ "	insert into client.plan (name, plan_type, wirecenter_id, area_name, area_centroid, area_bounds, created_at, updated_at, parent_plan_id)\n"
			+ "	select p.name, 2, w.id, w.wirecenter, st_centroid(w.geom), w.geom,  NOW(), NOW(), p.master_plan_id \n"
			+ "	from\n"
			+ "	inputs p,\n"
			+ "	(select distinct nt.master_plan_id, nt.wirecenter_id\n"
			+ "		from new_targets nt\n"
			+ "		join aro.wirecenters w on w.id = nt.wirecenter_id) nw\n"
			+ "	join aro.wirecenters w on w.id = nw.wirecenter_id\n"
			+ "	returning id, parent_plan_id as master_plan_id, wirecenter_id, area_centroid \n"
			+ ")\n"
			+ ",\n"
			+ "-- Create Central Offices (Pre conidtion no existing plans with 0 targets)\n"
			+ "updated_network_nodes as (\n"
			+ "	insert into client.network_nodes (plan_id, node_type_id, geog, geom)\n"
			+ "	select np.id, 1, np.area_centroid::geography, np.area_centroid \n"
			+ "	from new_plans np\n"
			+ "	returning id, plan_id\n"
			+ ")\n"
			+ ",\n"
			+ "-- Copy plan targets into existing plans by wire center\n"
			+ "update_plan_targets as (\n"
			+ "	insert into client.plan_targets (location_id, plan_id)\n"
			+ "	select nt.location_id, nt.plan_id\n"
			+ "	from selected_targets nt\n"
			+ "	where nt.plan_id is not null\n"
			+ "	returning id, plan_id\n"
			+ ")\n"
			+ ",\n"
			+ "-- Copy plan targets into new plans by wire center\n"
			+ "updated_new_plan_targets as (	\n"
			+ "	insert into client.plan_targets (location_id, plan_id)\n"
			+ "	select nt.location_id, p.id\n"
			+ "	from new_plans p \n"
			+ "	join new_targets nt on nt.wirecenter_id = p.wirecenter_id\n"
			+ "	returning id, plan_id\n"
			+ ")\n"
			+ ",\n"
			+ "-- Delete targets from existing plans\n"
			+ "updated_deleted_targets as (\n"
			+ "	delete from client.plan_targets \n"
			+ "	where id in (select id from deleted_locations)\n"
			+ "	returning id \n"
			+ ")\n"
			+ ",--track old plans with deletes (These will be deleted if 0 locations assigned)\n"
			+ "old_plans as (\n"
			+ "	select plan_id, sum(location_id) as location_count\n"
			+ "	from deleted_locations\n"
			+ "	group by plan_id\n"
			+ ")\n"
			+ ",\n"
			+ "-- Delete Old Plans with 0 locations\n"
			+ "deleted_plans as (\n"
			+ "	delete from client.plan where id in (select plan_id from old_plans where location_count = 0)\n"
			+ "	returning id \n"
			+ ")\n"
			+ ",\n"
			+ "-- Union all plans that require updates\n"
			+ "all_modified_plans as (\n"
			+ "select distinct p.plan_id \n"
			+ "from (\n"
			+ "(select distinct plan_id from update_plan_targets)\n"
			+ "union\n"
			+ "(select distinct plan_id from updated_new_plan_targets)\n"
			+ "union\n"
			+ "(select plan_id from old_plans where location_count > 0 )) p\n"
			+ ")\n"
			+ ",\n"
			+ "deleted_network_nodes as (\n"
			+ "	delete from client.network_nodes where plan_id in (select plan_id from all_modified_plans) and node_type_id != 1\n"
			+ "	returning id\n" + ")\n" + ",\n" + "deleted_fiber_routes as (\n"
			+ "	delete from client.fiber_route where plan_id \n"
			+ "		in (select plan_id from all_modified_plans)\n"
			+ "	returning id\n" + ")\n"
			+ "select plan_id from all_modified_plans", nativeQuery = true)
	List<Long> computeWirecenterUpdates(@Param("planId") long planId);

}
