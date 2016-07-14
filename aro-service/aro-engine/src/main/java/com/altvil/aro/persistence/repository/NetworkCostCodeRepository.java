package com.altvil.aro.persistence.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.NetworkCostCode;

@Repository
public interface NetworkCostCodeRepository extends
		JpaRepository<NetworkCostCode, Integer> {
	
	@Query(value = "select network_code_id, network_node_type_id from financial.network_cost_code_node_type", nativeQuery = true)
	@Transactional
	List<Object[]> queryCostCodeToNetworkNodeTypeOrdinal();
	
	@Query(value = "select network_cost_code_id, fiber_route_type_id from financial.network_code_fiber_type", nativeQuery = true)
	@Transactional
	List<Object[]> queryCostCodeToFiberTypeOrdinal();

}
