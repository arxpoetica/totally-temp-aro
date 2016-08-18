package com.altvil.aro.persistence.repository;

import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.altvil.aro.model.ServiceArea;

public interface ServiceAreaRepository extends
		JpaRepository<ServiceArea, Integer> {

	@Query(value = "select m.service_id \n"
			+ "from client.service_area_mapping m\n"
			+ "where m.service_layer_id = :layerId and m.super_id in (:superIds) and m.area_m2 > 1000", nativeQuery = true)
	Collection<ServiceArea> queryServiceAreasFromSuperServiceArea(
			@Param("layerId") int layerId,
			@Param("superIds") Collection<Integer> superIds);

}
