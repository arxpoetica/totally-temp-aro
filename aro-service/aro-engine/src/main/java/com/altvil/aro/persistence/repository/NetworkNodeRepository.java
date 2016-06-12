package com.altvil.aro.persistence.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.NetworkNode;

@Repository("networkNodeRepository")
public interface NetworkNodeRepository extends JpaRepository<NetworkNode, Integer>  {
	
	@Query(value = "with linked_locations as (\n"
			+ "SELECT\n"
			+ " l.id as id,\n"
			+ "	l.geom as point,\n"
			+ "    (SELECT gid \n"
			+ "		FROM ( SELECT aro.edges.gid, ST_Distance(aro.edges.geom::geography, l.geom::geography) AS distance \n"
			+ "			  FROM aro.edges where st_intersects(r.area_bounds, aro.edges.geom) ORDER BY l.geom <#> aro.edges.geom LIMIT 5 ) AS index_query ORDER BY distance LIMIT 1\n"
			+ "	) as gid\n"
			+ "FROM\n"
			+ "   aro.locations l\n"
			+ "   join client.route r on st_contains(r.area_bounds, l.geom)\n"
			+ "   where r.id = ?\n"
			+ ")\n"
			+ "select \n"
			+ "	ll.id as location_id, \n"
			+ "	ll.gid,\n"
			+ "	e.tlid,\n"
			+ "	ll.point::point as location_point,\n"
			+ "	st_line_locate_point(st_linemerge(e.geom), ll.point) as intersect_position,\n"
			+ "	st_closestpoint(st_linemerge(e.geom), ll.point)::point as intersect_point,\n"
			+ "	st_distance(ll.point::geography, st_closestpoint(e.geom, ll.point)::geography) as distance \n"
			+ "from linked_locations ll\n"
			+ "join aro.edges e on e.gid = ll.gid \n"
			+ "order by gid, intersect_position\n" + "limit 40000", nativeQuery = true)
	List<Object> queryLinkedLocations(int test);
	
	
	@Transactional
	@Query(value = "select n from NetworkNode n where n.routeId =:planId and n.nodeTypeId=:nodeTypeId")
	public List<NetworkNode> findEquipment(@Param("nodeTypeId") int nodeTypeId, @Param("planId") long planId) ;
	
		
	@Query(value = "update client.plan set total_count = :totalCount \n " +
	", total_cost=:totalCost, fiber_cost=:fiberCost " +
	", equipment_cost=:equipmentCost, co_cost = :coCost, fdh_cost=:fdhCost, fdt_cost=:fdtCost \n" +
	", total_revenue = :totalRevenue, household_revenue = :hhRevenue, celltower_revenue = :cellTowerRevenue\n" +
	", business_revenue = :bizRevenue, npv = :npv \n " +
	" where id = :planId", nativeQuery = true)
	@Modifying
	@Transactional
	void updateFinancials(
			@Param("planId")long planId,
			@Param("totalCount")double totalCount,
			@Param("totalCost")double totalCost,
			@Param("fiberCost")double fiberCost,
			@Param("equipmentCost")double equipmentCost,
			@Param("coCost")double coCost,
			@Param("fdhCost") double fdhCost,
			@Param("fdtCost")double fdtCost,
			@Param("totalRevenue")double totalRevenue,
			@Param("hhRevenue")double hhRevenue,
			@Param("cellTowerRevenue")double cellTowerRevenue, 
			@Param("bizRevenue")double bizRevenue,
			@Param("npv")double npv
			) ;

}
