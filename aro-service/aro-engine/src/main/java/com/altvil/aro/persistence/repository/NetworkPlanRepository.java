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
	
	  //TODO SystemProperty Repository
    @Query(value = "SELECT f.name, p.string_value\n" + 
            "FROM client.system_property p\n" + 
            "JOIN client.system_property_field f\n" + 
            "   ON f.id = p.property_field_id \n" + 
            "JOIN client.system_rule r\n" + 
            "   ON r.id = p.system_rule_id\n" + 
            "WHERE r.name = 'system_defaults'", nativeQuery = true)
    @Transactional
    List<Object[]> querySystemProperties();
	
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
			"(\n" + 
			"  SELECT gid \n" + 
			"  FROM (\n" + 
			"    SELECT \n" + 
			"      aro.edges.gid, \n" + 
			"      ST_Distance(cast(aro.edges.geom as geography), \n" + 
			"      cast(l.geom as geography)) AS distance \n" +
			"    FROM aro.edges \n" + 
			"    WHERE st_intersects(w.geom, aro.edges.geom) \n" + 
			"    ORDER BY l.geom <#> aro.edges.geom LIMIT 5 \n" + 
			"    ) AS index_query ORDER BY distance LIMIT 1\n" + 
			"  ) as gid\n" + 
			"FROM  client.service_area w" +
			" join aro.locations l on st_contains(w.geom, l.geom) " +
			" and l.state in :states" +
			" and w.id = :serviceAreaId" +
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
			"order by gid, intersect_position limit 80000", nativeQuery = true) // KG debugging
	List<Object[]> queryAllLocationsByServiceAreaId(@Param("serviceAreaId") int serviceAreaId, @Param("states") Collection<String> states) ;


	@Query(value = 
			"with selected_locations as (\n" + 
			"select l.id, b.gid as block_id, case when c.strength is null then 0 else c.strength end as competitor_strength\n" + 
			"   from client.service_area w \n" +
			"	join aro.locations l on w.id = :serviceAreaId and st_contains(w.geom, l.geom)\n" +
			"	join aro.census_blocks b on st_contains(b.geom, l.geom)\n" + 
			"	left join client.summarized_competitors_strength c on c.location_id = l.id and c.entity_type = 3\n" +
			"),\n" + 
			"bs as (\n" + 
			"  select l.id, l.block_id, e.entity_type, e.count, e.monthly_spend, l.competitor_strength\n" + 
			"  from selected_locations l\n" + 
			"  join client.business_summary e on e.location_id = l.id and  ((e.entity_type = 3 and monthly_recurring_cost>=:mrc) or e.entity_type !=3)\n" + 
			"   where year = :year\n" + 
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
	List<Object[]> queryAllFiberDemand(@Param("serviceAreaId") int serviceAreaId, @Param("year") int year, @Param("mrc") double mrc);

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
			+ "from client.service_area w \n"
			+ "join aro.edges a on "
			+ "w.id = :serviceAreaId "
			+ "and st_intersects(edge_buffer, a.geom)", nativeQuery = true)
	List<Object[]> queryRoadEdgesbyServiceAreaId(@Param("serviceAreaId") int serviceAreaId);

	@Query(value = "select  a.gid,  a.tlid, a.tnidf,  a.tnidt, st_astext(st_linemerge(a.geom)), edge_length\n"
			+ "from client.plan r \n"
			+ "join client.service_area w on r.wirecenter_id = w.id\n"
			+ "join aro.edges a on st_intersects(edge_buffer, a.geom)\n"
			+ "where r.id = :planId", nativeQuery = true)
	List<Object[]> queryRoadEdgesbyPlanId(@Param("planId") long planId);



	@Query(value = "select  a.gid,  a.tlid, a.tnidf,  a.tnidt, st_astext(st_linemerge(a.geom)), edge_length\n"
			+ "join aro.wirecenters w\n"
			+ "join aro.edges a on st_intersects(edge_buffer, a.geom)\n"
			+ "where w.id = :wirecenterId", nativeQuery = true)
	List<Object[]> queryRoadEdgesByWirecenterId(@Param("wirecenterId") int wireCenterId);

	
	
	@Modifying
    @Transactional
	@Query(value = "delete from client.plan where parent_plan_id = :planId", nativeQuery = true)
	void deleteChildPlans(@Param("planId") long planId) ;

    @Modifying
    @Transactional
	@Query(value="WITH selected_plan AS (\n" + 
			"    SELECT p.*\n" + 
			"    FROM client.plan p\n" + 
			"    WHERE p.id=:rootPlanId\n" + 
			")\n" + 
			",\n" + 
			"master_plans AS (\n" + 
			"    SELECT mp.id\n" + 
			"    FROM selected_plan rp\n" + 
			"    JOIN client.plan mp\n" + 
			"        ON mp.parent_plan_id = rp.id\n" + 
			")\n" + 
			",\n" + 
			"selected_service_areas AS (\n" + 
			"     SELECT\n" + 
			"        p.id, ST_Union(ST_MakeValid(sa.geom)) AS geom\n" + 
			"    FROM selected_plan p\n" + 
			"    JOIN client.selected_service_area s\n" + 
			"       ON s.plan_id = p.id\n" + 
			"    JOIN client.service_area sa \n" + 
			"      ON sa.id = s.service_area_id\n" + 
			"    GROUP BY p.id\n" + 
			")\n" + 
			",\n" + 
			"selected_analysis_areas AS (\n" + 
			"    SELECT \n" + 
			"        p.id, \n" + 
			"        ST_Union(ST_MakeValid(aa.geom)) AS geom\n" + 
			"    FROM selected_plan p\n" + 
			"    JOIN client.selected_analysis_area s\n" + 
			"        ON s.plan_id = p.id\n" + 
			"    JOIN client.analysis_area aa\n" + 
			"        ON aa.id = s.analysis_area_id\n" + 
			"    GROUP BY p.id\n" + 
			"),\n" + 
			"union_area AS (\n" + 
			"    SELECT ST_MakeValid(ST_Union(u.geom)) AS geom\n" + 
			"        FROM (\n" + 
			"            SELECT geom FROM selected_service_areas\n" + 
			"            UNION\n" + 
			"            SELECT geom FROM selected_analysis_areas\n" + 
			"        ) u\n" + 
			")\n" +
			"UPDATE client.plan\n" +
			"SET area_bounds = (SELECT geom FROM union_area)\n" +
			"WHERE id IN (SELECT id FROM master_plans)\n", nativeQuery = true) 
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
			"		cast(ST_Buffer(cast(ST_Union(f.geom) AS geography),3) AS geometry) AS geom\n" + 
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
    void updateConduitInputs(@Param("inputMasterPlan") long planId, @Param("selectedPlanId") long selectedPlanId);

    
    
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

	@Query(value = "select wirecenter_id from client.plan where id = :planId", nativeQuery = true)
	int getPlanServiceAreaId(@Param("planId") long planId);

	@Query(value = "select st.stusps \n" +
			"    from client.service_area sa \n" +
			"    inner join aro.states st \n" +
			"    on ST_Intersects(sa.geom, st.geom) \n" +
			"        and sa.id =:serviceAreaId", nativeQuery = true)
	Collection<String> getServiceAreaStates(@Param("serviceAreaId") Integer serviceAreaId);

}
