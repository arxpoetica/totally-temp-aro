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
			"WITH selected_plan AS (\n" + 
			"	SELECT p.parent_plan_id as plan_id, p.service_layer_id as layer_id\n" + 
			"	FROM client.plan p\n" + 
			"	WHERE p.id=:planId\n" + 
			")\n" + 
			",\n" + 
			"selected_super_areas AS (\n" + 
			"	SELECT sa.service_area_id\n" + 
			"	FROM selected_plan p\n" + 
			"	JOIN client.selected_service_area s\n" + 
			"		ON s.plan_id = p.plan_id\n" + 
			"	JOIN client.service_area_assignment sa \n" + 
			"		ON sa.service_area_id = s.service_area_id \n" + 
			"		AND sa.service_layer_id  = p.layer_id\n" + 
			"		AND sa.is_primary\n" + 
			")\n" + 
			",\n" + 
			"selected_wire_centers AS (\n" + 
			"	SELECT sa.id AS service_area_id\n" + 
			"	FROM selected_plan p\n" + 
			"	JOIN client.selected_service_area s\n" + 
			"		ON s.plan_id = p.plan_id\n" + 
			"	JOIN client.service_area sa\n" + 
			"		ON sa.id = s.service_area_id\n" + 
			")\n" + 
			",\n" + 
			"selected_analysis_areas AS (\n" + 
			"	SELECT sa.service_area_id\n" + 
			"	FROM selected_plan p\n" + 
			"	JOIN client.selected_analysis_area s\n" + 
			"		ON s.plan_id = p.plan_id\n" + 
			"	JOIN client.analysis_area_assignment sa\n" + 
			"		ON sa.analysis_area_id = s.analysis_area_id\n" + 
			"		AND sa.service_layer_id  = p.layer_id\n" + 
			"		AND sa.is_primary\n" + 
			")\n" + 
			",\n" + 
			"distinct_areas AS (\n" + 
			"	SELECT DISTINCT a.service_area_id\n" + 
			"	FROM (\n" + 
			"		SELECT service_area_id FROM selected_super_areas\n" + 
			"		UNION\n" + 
			"		SELECT service_area_id FROM selected_wire_centers\n" + 
			"		UNION\n" + 
			"		SELECT service_area_id FROM selected_analysis_areas\n" + 
			"	) a \n" + 
			")\n" + 
			"SELECT sa.*\n" + 
			"FROM distinct_areas da \n" + 
			"JOIN client.service_area sa\n" + 
			"	ON sa.id = da.service_area_id", nativeQuery = true)
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
