package com.altvil.aro.persistence.repository;

import java.math.BigInteger;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.NetworkPlan;

@Repository("networkPlanRepository")
public interface NetworkPlanRepository extends
		JpaRepository<NetworkPlan, Long> {
	
	
	
	//TODO Create SpeedCategory Repository
	@Query(value = "select s.provname, s.speed_category, s.stateabbr, b.brand_strength\n" + 
			"from nbm.competitor_speed_category s\n" + 
			"join nbm.brand_strength b on b.provname = s.provname \n" + 
			"where gid = :censusBlockId", nativeQuery = true)
	@Transactional
	List<Object[]> querySpeedCategoriesElements(@Param("censusBlockId") int cenusBlock);
	
	
	//TODO Create Price Repository
	@Query(value = "select name, uom_name, price from financial.network_price", nativeQuery = true)
	List<Object[]> queryPriceModelElements();
	
	
	@Query(value = "SELECT r.wirecenter_id \n" +
			"FROM client.plan r \n" +
			"WHERE r.id = :planId", nativeQuery = true)
	Integer queryWirecenterIdForPlanId(@Param("planId") long planId);
	
	
	@Query(value = "select p from NetworkPlan p where p.parentPlan.id = :planId")
	List<NetworkPlan> queryChildPlans(@Param("planId") long planId);
	
	@Query(value = "with linked_locations as (\n" + 
			"SELECT\n" + 
			"l.id as id,\n" + 
			"l.geom as point,\n" + 
			"(SELECT gid \n" + 
			"FROM (SELECT aro.edges.gid, ST_Distance(cast(aro.edges.geom as geography), cast(l.geom as geography)) AS distance \n" + 
			"FROM aro.edges where st_intersects(r.area_bounds, aro.edges.geom) ORDER BY l.geom <#> aro.edges.geom LIMIT 5 ) AS index_query ORDER BY distance LIMIT 1\n" + 
			") as gid\n" + 
			"FROM client.plan r\n" + 
			"join client.service_area w on r.wirecenter_id = w.id\n" + 
			"join aro.locations l on st_contains(w.geom, l.geom)\n" + 
			"where r.id = :planId\n" + 
			")\n" + 
			"select\n" + 
			"ll.id as location_id,\n" + 
			"ll.gid,\n" + 
			"e.tlid,\n" + 
			"st_astext(ll.point) as location_point,\n" + 
			"st_line_locate_point(st_linemerge(e.geom), ll.point) as intersect_position,\n" + 
			"st_astext(st_closestpoint(st_linemerge(e.geom), ll.point)) as intersect_point,\n" + 
			"st_distance(cast(ll.point as geography), cast(st_closestpoint(e.geom, ll.point) as geography)) as distance \n" + 
			"from linked_locations ll\n" + 
			"join aro.edges e on e.gid = ll.gid\n" + 
			"order by gid, intersect_position limit 40000", nativeQuery = true) // KG debugging
	List<Object[]> queryAllLocationsByPlanId(@Param("planId") long id) ;

	
	@Query(value = "with selected_locations as (\n" + 
			"select l.id, b.gid as block_id, case when c.strength is null then 0 else c.strength end as competitor_strength	\n" + 
			"	from client.plan_targets t\n" + 
			"	join aro.locations l on l.id = t.location_id\n" + 
			"	join aro.census_blocks b on st_contains(b.geom, l.geom)\n" + 
			"	left join client.summarized_competitors_strength c on c.location_id = l.id and c.entity_type = 3\n" + 
			"	where plan_id = :planId\n" + 
			"),\n" + 
			"bs as (\n" + 
			"  select l.id, l.block_id, e.entity_type, e.count, e.monthly_spend, l.competitor_strength\n" + 
			"  from selected_locations l\n" + 
			"  join client.business_summary e on e.location_id = l.id and ((e.entity_type = 3 and monthly_recurring_cost>=:mrc) or e.entity_type !=3)\n" + 
			"   where year = :year and city_id = 1\n" + 
			"),\n" + 
			"hs as (\n" + 
			"  select l.id, l.block_id, 4 as entity_type, e.count, e.count*60 as monthly_spend, l.competitor_strength\n" + 
			"  from selected_locations l\n" + 
			"  join client.households_summary e on e.location_id = l.id\n" + 
			"),\n" + 
			"ct as (\n" + 
			"  select l.id, l.block_id, 5 as entity_type, e.count, e.count*500 as monthly_spend, l.competitor_strength\n" + 
			"  from selected_locations l\n" + 
			"  join client.celltower_summary e on e.location_id = l.id\n" + 
			")\n" + 
			"select * from  bs\n" + 
			"UNION\n" + 
			"select * from  hs\n" + 
			"UNION\n" + 
			"select * from ct\n" + 
			"limit 200000", 
			nativeQuery = true)
	List<Object[]> queryFiberDemand(@Param("planId") long planId, @Param("year") int year,  @Param("mrc") double mrc);
	
	@Query(value = 
			"with selected_locations as (\n" + 
			"select l.id, b.gid as block_id, case when c.strength is null then 0 else c.strength end as competitor_strength\n" + 
			"	from client.plan p \n" + 
			"	join client.service_area w on w.id = p.wirecenter_id\n" + 
			"	join aro.locations l on st_contains(w.geom, l.geom)\n" + 
			"	join aro.census_blocks b on st_contains(b.geom, l.geom)\n" + 
			"	left join client.summarized_competitors_strength c on c.location_id = l.id and c.entity_type = 3\n" + 
			"	where p.id =  :planId\n" + 
			"),\n" + 
			"bs as (\n" + 
			"  select l.id, l.block_id, e.entity_type, e.count, e.monthly_spend, l.competitor_strength\n" + 
			"  from selected_locations l\n" + 
			"  join client.business_summary e on e.location_id = l.id and  ((e.entity_type = 3 and monthly_recurring_cost>=:mrc) or e.entity_type !=3)\n" + 
			"   where year = :year and city_id = 1\n" + 
			"),\n" + 
			"hs as (\n" + 
			"  select l.id, l.block_id, 4 as entity_type, e.count, e.count*60 as monthly_spend, l.competitor_strength\n" + 
			"  from selected_locations l\n" + 
			"  join client.households_summary e on e.location_id = l.id\n" + 
			"),\n" + 
			"ct as (\n" + 
			"  select l.id, l.block_id, 5 as entity_type, e.count, e.count*500 as monthly_spend, l.competitor_strength\n" + 
			"  from selected_locations l\n" + 
			"  join client.celltower_summary e on e.location_id = l.id\n" + 
			")\n" + 
			"select * from  bs\n" + 
			"UNION\n" + 
			"select * from  hs\n" + 
			"UNION\n" +
			"select * from ct\n" +
			"limit 200000", nativeQuery = true)
	List<Object[]> queryAllFiberDemand(@Param("planId") long planId, @Param("year") int year, @Param("mrc") double mrc);

	@Query(value = "SELECT location_id FROM client.plan_targets pt\n" +
			"WHERE pt.plan_id = :planId", nativeQuery = true)
	List<BigInteger> querySelectedLocationsByPlanId(@Param("planId") long planId);
	
	@Query(value = "with linked_locations as (\n"
			+ "SELECT\n"
			+ "l.id as id,\n"
			+ "l.geom as point,\n"
			+ "(SELECT gid \n"
			+ "FROM (SELECT aro.edges.gid, ST_Distance(cast(aro.edges.geom as geography), cast(l.geom as geography)) AS distance \n"
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
			+ "st_astext(ll.point) as location_point,\n"
			+ "st_line_locate_point(st_linemerge(e.geom), ll.point) as intersect_position,\n"
			+ "st_astext(st_closestpoint(st_linemerge(e.geom), ll.point)) as intersect_point,\n"
			+ "st_distance(cast(ll.point as geography), cast(st_closestpoint(e.geom, ll.point) as geography)) as distance \n"
			+ "from linked_locations ll\n"
			+ "join aro.edges e on e.gid = ll.gid\n"
			+ "order by gid, intersect_position limit 40000", nativeQuery = true)
	List<Object[]> queryLinkedLocations(@Param("planId") long planId);

	@Query(value = "with nodes as (\n" + 
			"		SELECT\n" + 
			"			n.id,\n" + 
			"			n.node_type_id,	\n" + 
			"			n.geom,\n" + 
			"			w.location_edge_buffer as buffer_geom\n" + 
			"			FROM\n" + 
			"				client.plan p\n" + 
			"				join client.network_nodes n on p.id = n.plan_id and n.node_type_id = 1 \n" + 
			"				join client.service_area w on w.id = p.wirecenter_id\n" + 
			"			WHERE \n" + 
			"				p.id = :planId\n" + 
			"			limit 200 \n" + 
			"		)\n" + 
			"		, \n" + 
			"		linked_nodes as (\n" + 
			"			SELECT\n" + 
			"			l.id,\n" + 
			"			l.geom as point,\n" + 
			"			l.node_type_id,\n" + 
			"			-- First retrieve the 5 closest edges to each network_cos, using index-based bounding box search.\n" + 
			"			-- Then measure geographic distance to each (spheroid calcualtion) and find the closest.\n" + 
			"			-- Draw line connecting network_cos to edge.\n" + 
			"			(SELECT gid\n" + 
			"				FROM ( SELECT  aro.edges.gid, ST_Distance(cast(aro.edges.geom as geography), cast(l.geom as geography)) AS distance\n" + 
			"					  FROM aro.edges where st_intersects(l.buffer_geom, aro.edges.geom) ORDER BY l.geom <#> aro.edges.geom LIMIT 5 ) AS index_query ORDER BY distance LIMIT 1\n" + 
			"			) as gid\n" + 
			"			FROM nodes l\n" + 
			"		)\n" + 
			"		SELECT \n" + 
			"			ll.id,\n" + 
			"			ll.gid,\n" + 
			"			e.tlid,\n" + 
			"			st_astext(ll.point),\n" + 
			"			st_line_locate_point(st_linemerge(e.geom), ll.point) as intersect_position,\n" + 
			"			st_astext(st_closestpoint(st_linemerge(e.geom), ll.point)) as intersect_point,\n" + 
			"			st_distance(cast(ll.point as geography), cast(st_closestpoint(e.geom, ll.point) as geography)) as distance,\n" + 
			"			ll.node_type_id\n" + 
			"			FROM linked_nodes ll\n" + 
			"		JOIN  aro.edges  e on e.gid = ll.gid\n" + 
			"		ORDER BY gid, intersect_position\n" + 
			"	limit 200", nativeQuery = true)
	List<Object[]> querySourceLocations(@Param("planId") long planId);

	@Query(value = "select  a.gid,  a.tlid, a.tnidf,  a.tnidt, st_astext(st_linemerge(a.geom)), edge_length\n"
			+ "from client.plan r \n"
			+ "join client.service_area w on r.wirecenter_id = w.id\n"
			+ "join aro.edges a on st_intersects(edge_buffer, a.geom)\n"
			+ "where r.id = :planId", nativeQuery = true)
	List<Object[]> queryRoadEdgesbyPlanId(@Param("planId") long planId);

	
	
	@Modifying
    @Transactional
	@Query(value = "delete from client.plan where parent_plan_id = :planId", nativeQuery = true)
	void deleteChildPlans(@Param("planId") long planId) ;
			
	
    @Modifying
    @Transactional
	@Query(value = "with inputs as (\n" + 
			" select p.id as master_plan_id, p.* \n" + 
			" from client.plan p where p.id = :planId\n" + 
			")\n" + 
			",\n" + 
			"original_targets as (\n" + 
			" select pt.id, pt.location_id, pt.plan_id, mp.master_plan_id, wp.wirecenter_id\n" + 
			" from inputs mp\n" + 
			" join client.plan wp on wp.parent_plan_id = mp.id\n" + 
			" join client.plan_targets pt on pt.plan_id = wp.id\n" + 
			")\n" + 
			",\n" + 
			"selected_targets as (\n" + 
			"	select mt.location_id, ot.plan_id, mp.master_plan_id, ot.wirecenter_id\n" + 
			"	from inputs mp\n" + 
			"	join client.plan_targets mt on mt.plan_id = mp.id and mt.plan_id = mp.id\n" + 
			"	left join original_targets ot on ot.location_id = mt.location_id \n" + 
			")\n" + 
			",\n" + 
			"new_targets as (\n" + 
			"	select st.location_id, st.master_plan_id, w.id as wirecenter_id  \n" + 
			"	from selected_targets st \n" + 
			"	join aro.locations l on l.id = st.location_id\n" + 
			"	join client.service_area w on st_contains(w.geom, l.geom) and service_type='A' and service_layer_id=:layerId\n" + 
			"	where st.plan_id is null\n" + 
			")\n" + 
			",\n" + 
			"deleted_locations as (\n" + 
			"	select ot.location_id, ot.plan_id, ot.master_plan_id, ot.wirecenter_id\n" + 
			"	from original_targets ot\n" + 
			"	left join selected_targets st on st.location_id = ot.location_id and st.plan_id = ot.plan_id\n" + 
			"	where st.location_id is null \n" + 
			")\n" + 
			",\n" + 
			"new_plans as (\n" + 
			"	insert into client.plan (name, plan_type, wirecenter_id, area_name, area_centroid, area_bounds, created_at, updated_at, parent_plan_id)\n" + 
			"	select p.name, 'W', w.id, w.code, st_centroid(w.geom), w.geom,  NOW(), NOW(), p.master_plan_id \n" + 
			"	from\n" + 
			"	inputs p,\n" + 
			"	(select distinct nt.master_plan_id, nt.wirecenter_id\n" + 
			"	from new_targets nt\n" + 
			"	join client.service_area w on w.id = nt.wirecenter_id) nw\n" + 
			"	join client.service_area w on w.id = nw.wirecenter_id\n" + 
			"	returning id, parent_plan_id as master_plan_id, wirecenter_id, area_centroid \n" + 
			")\n" + 
			",\n" + 
			"updated_network_nodes AS (\n" + 
			"	INSERT INTO client.network_nodes (plan_id, node_type_id, geog, geom)\n" + 
			"	SELECT\n" + 
			"		p.id,\n" + 
			"		n.node_type_id,\n" + 
			"		n.geog,\n" + 
			"		n.geom\n" + 
			"	FROM new_plans p\n" + 
			"	JOIN client.plan_head h on h.service_area_id = p.wirecenter_id\n" + 
			"	JOIN client.network_nodes n on h.plan_id = h.id\n" + 
			"	WHERE n.node_type_id in(1)\n" + 
			"	RETURNING id, plan_id\n" + 
			")\n" + 
			",\n" + 
			"updated_plan_sources as (\n" + 
			"	insert into client.plan_sources (network_node_id, plan_id)\n" + 
			"	select id, plan_id from updated_network_nodes	\n" + 
			")\n" + 
			",\n" + 
			"update_plan_targets as (\n" + 
			"	insert into client.plan_targets (location_id, plan_id)\n" + 
			"	select nt.location_id, nt.plan_id\n" + 
			"	from selected_targets nt\n" + 
			"	where nt.plan_id is not null\n" + 
			"	returning id, plan_id\n" + 
			")\n" + 
			",\n" + 
			"updated_new_plan_targets as (	\n" + 
			"	insert into client.plan_targets (location_id, plan_id)\n" + 
			"	select nt.location_id, p.id\n" + 
			"	from new_plans p \n" + 
			"	join new_targets nt on nt.wirecenter_id = p.wirecenter_id\n" + 
			"	returning id, plan_id\n" + 
			")\n" + 
			",\n" + 
			"updated_deleted_targets as (\n" + 
			"	delete from client.plan_targets \n" + 
			"	where id in (select id from deleted_locations)\n" + 
			"	returning id \n" + 
			")\n" + 
			",\n" + 
			"old_plans as (\n" + 
			"	select plan_id, sum(1) as location_count\n" + 
			"	from deleted_locations\n" + 
			"	group by plan_id\n" + 
			")\n" + 
			",\n" + 
			"deleted_plans as (\n" + 
			"	delete from client.plan where id in (select plan_id from old_plans where location_count = 0)\n" + 
			"	returning id \n" + 
			")\n" + 
			",\n" + 
			"all_modified_plans as (\n" + 
			"select distinct p.plan_id \n" + 
			"from (\n" + 
			"(select distinct plan_id from update_plan_targets)\n" + 
			"union\n" + 
			"(select distinct plan_id from updated_new_plan_targets)\n" + 
			"union\n" + 
			"(select plan_id from old_plans where location_count > 0 )) p\n" + 
			")\n" + 
			",\n" + 
			"deleted_network_nodes as (\n" + 
			"	delete from client.network_nodes where plan_id in (select plan_id from all_modified_plans) and node_type_id != 1\n" + 
			"	returning id\n" + 
			")\n" + 
			",\n" + 
			"deleted_fiber_routes as (\n" + 
			"	delete from client.fiber_route where plan_id \n" + 
			"		in (select plan_id from all_modified_plans)\n" + 
			"	returning id\n" + 
			")\n" + 
			"select plan_id from all_modified_plans", nativeQuery = true)
	List<Number> computeWirecenterUpdates(@Param("planId") long planId, @Param("layerId") int layerId);
    
    
    
    @Modifying
    @Transactional
	@Query(value="WITH root_plans AS (\n" + 
			"	SELECT\n" + 
			"		m.name as master_name,\n" + 
			"		m.id as master_plan_id,\n" + 
			"		h.*\n" + 
			"	FROM client.plan m, client.plan h \n" + 
			"	WHERE m.id = :planId\n" + 
			"	AND h.plan_type='H' \n" + 
			"	AND h.wirecenter_id IN (:wireCentersIds) \n" + 
			")\n" + 
			",\n" + 
			"new_plans as (\n" + 
			"	INSERT INTO client.plan\n" + 
			"		(service_layer_id, name, plan_type, wirecenter_id, area_name, area_centroid, area_bounds, created_at, updated_at, parent_plan_id)\n" + 
			"	SELECT\n" + 
			"		r.service_layer_id,\n" + 
			"		r.master_name,\n" + 
			"		'W',\n" + 
			"		r.wirecenter_id,\n" + 
			"		r.area_name,\n" + 
			"		r.area_centroid,\n" + 
			"		r.area_bounds,\n" + 
			"		NOW(),\n" + 
			"		NOW(),\n" + 
			"		r.master_plan_id \n" + 
			"	FROM root_plans r\n" + 
			"	RETURNING\n" + 
			"		id,\n" + 
			"		parent_plan_id as master_plan_id,\n" + 
			"		wirecenter_id, area_centroid \n" + 
			")\n" + 
			",\n" + 
			"updated_network_nodes AS (\n" + 
			"	INSERT INTO client.network_nodes\n" + 
			"		(plan_id, node_type_id, geog, geom)\n" + 
			"	SELECT\n" + 
			"		p.id,\n" + 
			"		n.node_type_id,\n" + 
			"		n.geog,\n" + 
			"		n.geom\n" + 
			"	FROM root_plans r\n" + 
			"	JOIN new_plans p on p.wirecenter_id = r.wirecenter_id\n" + 
			"	JOIN client.network_nodes n on n.plan_id = r.id\n" + 
			"	WHERE n.node_type_id in(1)\n" + 
			"	RETURNING plan_id\n" + 
			")\n" + 
			"SELECT DISTINCT plan_id \n" + 
			"FROM updated_network_nodes\n", nativeQuery = true) 
    List<Number> computeWirecenterUpdates(@Param("planId") long planId, @Param("wireCentersIds") Collection<Integer> wireCentersIds);

    @Modifying
    @Transactional
	@Query(value="WITH selected_plan AS (\n" + 
			"    SELECT p.*\n" + 
			"    FROM client.plan p\n" + 
			"    WHERE p.id=:rootPlanId\n" + 
			")\n" + 
			",\n" + 
			"master_plans AS (\n" + 
			"	SELECT mp.id\n" + 
			"	FROM selected_plan rp\n" + 
			"	JOIN client.plan mp\n" + 
			"		ON mp.parent_plan_id = rp.id\n" + 
			")\n" + 
			",\n" + 
			"selected_service_areas AS (\n" + 
			"     SELECT\n" + 
			"		p.id, ST_MakeValid(ST_Union(sa.geom)) AS geom\n" + 
			"    FROM selected_plan p\n" + 
			"    JOIN client.selected_service_area s\n" + 
			"       ON s.plan_id = p.id\n" + 
			"    JOIN client.service_area sa \n" + 
			"      ON sa.id = s.service_area_id\n" + 
			"	GROUP BY p.id\n" + 
			")\n" + 
			",\n" + 
			"selected_analysis_areas AS (\n" + 
			"    SELECT \n" + 
			"		p.id, \n" + 
			"		ST_MakeValid(ST_Union(aa.geom)) AS geom\n" + 
			"    FROM selected_plan p\n" + 
			"    JOIN client.selected_analysis_area s\n" + 
			"        ON s.plan_id = p.id\n" + 
			"    JOIN client.analysis_area aa\n" + 
			"		ON aa.id = s.analysis_area_id\n" + 
			"	GROUP BY p.id\n" + 
			"),\n" + 
			"union_area AS (\n" + 
			"	SELECT ST_MakeValid(ST_Union(u.geom)) AS geom\n" + 
			"		FROM (\n" + 
			"			SELECT geom FROM selected_service_areas\n" + 
			"			UNION\n" + 
			"			SELECT geom FROM selected_analysis_areas\n" + 
			"		) u\n" + 
			")\n" + 
			"UPDATE client.plan\n" + 
			"SET area_bounds = (SELECT geom FROM union_area)\n" + 
			"WHERE id IN (SELECT id FROM master_plans)", nativeQuery = true) 
    void updateMasterPlanAreas(@Param("rootPlanId") long rootPlanId);

    
    
    @Modifying
    @Transactional
	@Query(value=
	
			"WITH selected_master AS (\n" + 
			"	SELECT p.*\n" + 
			"	FROM client.plan p\n" + 
			"	WHERE p.id = :inputMasterPlan\n" + 
			")\n" + 
			",\n" + 
			"all_fiber AS (\n" + 
			"	SELECT\n" + 
			"		id,\n" + 
			"		ST_Buffer(ST_Union(f.geom)::geography,3)::geometry AS geom\n" + 
			"	FROM (\n" + 
			"	(SELECT mp.id, pc.geom\n" + 
			"	FROM selected_master mp\n" + 
			"	JOIN client.plan_fiber_conduit pc\n" + 
			"		ON pc.plan_id = mp.id)\n" + 
			"\n" + 
			"		UNION\n" + 
			"\n" + 
			"	(SELECT mp.id, pc.geom\n" + 
			"	FROM selected_master mp\n" + 
			"	JOIN client.plan wp\n" + 
			"		ON wp.parent_plan_id = mp.id\n" + 
			"	JOIN client.fiber_route pc\n" + 
			"		ON pc.plan_id = wp.id)\n" + 
			"	) AS f\n" + 
			"	GROUP BY id\n" + 
			")\n" + 
			"INSERT INTO client.plan_fiber_conduit\n" + 
			"	(plan_id, geom)\n" + 
			"SELECT sp.id, a.geom \n" + 
			"FROM all_fiber a, client.plan sp WHERE sp.id =:selectedPlanId\n"
			, nativeQuery = true) 
    List<Number> updateConduitInputs(@Param("inputMasterPlan") long planId, @Param("selectedPlanId") long selectedPlanId);

    
    
	@Query(value = "select id from client.plan where parent_plan_id = :planId", nativeQuery = true)
	List<Number> wireCenterPlanIdsFor(@Param("planId") long planId);
	
	@Query(value = "WITH  selected_segs AS (\n" + 
			" 	select s.gid, s.construction_type, start_ratio, end_ratio\n" + 
			" 	FROM client.conduit_edge_segments s\n" + 
			"   WHERE s.start_ratio IS NOT NULL AND s.end_ratio IS NOT NULL and s.plan_id = :planId\n" + 
			")\n" + 
			"SELECT  \n" + 
			"    gid, \n" + 
			"    MAX(construction_type) AS construction_type,  \n" + 
			"    MIN(start_ratio) AS start_ratio, \n" + 
			"    MAX(end_ratio) AS end_ratio\n" + 
			"FROM selected_segs s\n" + 
			"GROUP BY gid", nativeQuery = true)
	List<Object[]> queryConduitSections(@Param("planId") long planId);
	
	
	@Query(value = "SELECT\n" + 
			" c.gid,\n" + 
			" c.construction_type,\n" + 
			" CASE \n" + 
			"	WHEN start_ratio < end_ratio THEN start_ratio \n" + 
			"	ELSE 0 \n" + 
			"	END AS start_ratio, \n" + 
			" CASE\n" + 
			"	WHEN start_ratio < end_ratio THEN end_ratio \n" + 
			"	WHEN edge_length = segment_length THEN 1 \n" + 
			"	ELSE 0 \n" + 
			" END AS end_ratio 	\n" + 
			" FROM client.plan_conduit_fiber c\n" + 
			"WHERE plan_id = :planId\n" + 
			"AND end_ratio >= start_ratio ", nativeQuery = true)
	List<Object[]> queryPlanConduitSections(@Param("planId") long planId);
	
	
}
