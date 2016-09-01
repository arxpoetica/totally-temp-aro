package com.altvil.aro.persistence.repository;

import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.ServiceArea;

@Repository
public interface ServiceAreaRepository extends
		JpaRepository<ServiceArea, Integer> {

	
	@Query(value = 
			"SELECT distinct\n" + 
			"	sa.*\n" + 
			"FROM client.plan mp\n" + 
			"JOIN client.service_area sa\n" + 
			"	ON sa.service_type  = 'A'\n" + 
			"	AND sa.service_layer_id = mp.service_layer_id\n" + 
			"	AND  ST_Contains(mp.area_bounds, sa.geom)\n" + 
			"	AND mp.id = :planId", nativeQuery = true)
	@Transactional
	Collection<ServiceArea> querySelectedServiceAreas(
			@Param("planId") long planId);
	
	
	@Query(value = 
			"SELECT sa.*\n" + 
			"FROM (\n" + 
			"	SELECT DISTINCT sa.id\n" + 
			"	FROM client.plan mp\n" + 
			"	JOIN client.plan rp\n" + 
			"		ON rp.id = mp.parent_plan_id\n" + 
			"	JOIN client.plan_targets t\n" + 
			"		ON t.plan_id = rp.id\n" + 
			"	JOIN aro.locations l\n" + 
			"		ON l.id = t.location_id\n" + 
			"	JOIN client.service_area sa\n" + 
			"		ON sa.service_layer_id = mp.service_layer_id\n" + 
			"		AND ST_CONTAINS(sa.geom,l.geom)\n" + 
			"	WHERE mp.id = :planId\n" + 
			") s\n" + 
			"JOIN client.service_area sa\n" + 
			"	ON sa.id = s.id\n",
			nativeQuery = true)
	@Transactional
	Collection<ServiceArea> querySelectedLocationServiceAreas(
			@Param("planId") long planId);
	
	@Query(value = 
			"INSERT INTO client.plan_targets (location_id, plan_id)\n" + 
			"SELECT l.id, wp.id \n" + 
			"FROM client.plan mp \n" + 
			"JOIN client.plan wp\n" + 
			"	ON  wp.parent_plan_id = mp.id\n" + 
			"JOIN client.plan rp \n" + 
			"	ON rp.id= mp.parent_plan_id\n" + 
			"JOIN client.service_area sa \n" + 
			"	ON sa.id = wp.wirecenter_id\n" + 
			"JOIN client.plan_targets t\n" + 
			"	ON t.plan_id = rp.id\n" + 
			"JOIN aro.locations l \n" + 
			"	ON l.id = t.location_id\n" + 
			"	AND ST_CONTAINS(sa.geom, l.geom)\n" + 
			"WHERE mp.id = :masterPlanId",
			nativeQuery = true)
	@Transactional
	@Modifying
	void updateWireCenterPlanLocations(
			@Param("masterPlanId") long masterPlanId);


}
