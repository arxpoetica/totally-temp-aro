package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.FiberRoute;

@Repository
public interface FiberRouteRepository extends JpaRepository<FiberRoute, Long> {

	@Query(value = "delete from client.fiber_route where plan_id = :planId", nativeQuery = true)
	@Modifying
	@Transactional
	void deleteFiberRoutes(@Param("planId")long planId);

}
