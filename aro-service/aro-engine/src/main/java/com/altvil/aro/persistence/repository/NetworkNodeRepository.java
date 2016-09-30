package com.altvil.aro.persistence.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkNodeType;

@Repository("networkNodeRepository")
public interface NetworkNodeRepository extends JpaRepository<NetworkNode, Integer>  {
	
//	@Query(value = "", nativeQuery = true)
//	@Transactional
//	@Modifying
//	Integer updateEntityServiceLayerEquipment(@Param("") int serviceLayer);
	
	
	@Transactional
	@Query(value = "select n from NetworkNode n where n.routeId =:planId and n.networkNodeType=:nodeType")
	public List<NetworkNode> findEquipment(@Param("nodeType") NetworkNodeType nodeType, @Param("planId") long planId) ;
	
	
	
	@Query(value = "select total_cost from client.plan where id =:planId", nativeQuery=true)
	public Double getTotalCost(@Param("planId") long planId) ;
	
	
		
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

	@Query(value = "delete from client.network_nodes where plan_id = :planId", nativeQuery = true)
	@Modifying
	@Transactional
	void deleteNetworkNodes(@Param("planId")long planId);

}
