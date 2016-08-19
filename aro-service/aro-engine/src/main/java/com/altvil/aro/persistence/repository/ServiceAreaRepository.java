package com.altvil.aro.persistence.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.ServiceArea;

@Repository
public interface ServiceAreaRepository extends
		JpaRepository<ServiceArea, Integer> {

	@Query(value = "with selected_areas as (\n"
			+ "	select aa.id as analysis_area_id, sa.id as service_area_id, st_area(cast(st_intersection(aa.geom, sa.geom) as geography)) as area\n"
			+ "	from client.service_area sa \n"
			+ "	join client.service_area aa on sa.service_type = 'A' and aa.service_type = 'S' and st_intersects(aa.geom, sa.geom) and sa.service_layer_id = :serviceLayerId\n"
			+ "	where  aa.id in (:superLayerIds) \n"
			+ ")\n"
			+ ",\n"
			+ "intersected_areas as (\n"
			+ "	select svc.id, max(st_area(cast(st_intersection(aa.geom, svc.geom) as geography))) as area \n"
			+ "	from client.service_area svc\n"
			+ "	join selected_areas sel on sel.service_area_id = svc.id\n"
			+ "	join client.service_area aa on st_intersects(aa.geom, svc.geom) and aa.service_type = 'S' and aa.service_layer_id = :analysisLayerId\n"
			+ "	group by svc.id\n"
			+ ")\n"
			+ "select svc.*\n"
			+ "from selected_areas sa\n"
			+ "join intersected_areas isa on isa.id = sa.service_area_id and isa.area = sa.area \n"
			+ "join client.service_area svc on svc.id = sa.analysis_area_id", nativeQuery = true)
	Collection<ServiceArea> queryServiceAreasFromSuperServiceAreas(
			@Param("superLayerIds") Collection<Integer> superLayerIds,
			@Param("serviceLayerId") int serviceLayerId,
			@Param("analysisLayerId") int analysisLayerId);

	@Query(value = "with selected_areas as (\n"
			+ "	select aa.id as analysis_area_id, sa.id as service_area_id, st_area(cast(st_intersection(aa.geom, sa.geom) as geography)) as area\n"
			+ "	from client.service_area sa \n"
			+ "	join client.analysis_area aa on sa.service_type = 'A' and st_intersects(aa.geom, sa.geom) and sa.service_layer_id = :serviceLayerId\n"
			+ "	where aa.id in (:analysisAreaIds)\n"
			+ ")\n"
			+ ",\n"
			+ "intersected_areas as (\n"
			+ "	select svc.id, max(st_area(cast(st_intersection(aa.geom, svc.geom) as geography))) as area \n"
			+ "	from client.service_area svc\n"
			+ "	join selected_areas sel on sel.service_area_id = svc.id\n"
			+ "	join client.analysis_area aa on st_intersects(aa.geom, svc.geom) and aa.analysis_layer_id=:analysisLayerId\n"
			+ "	group by svc.id\n"
			+ ")\n"
			+ "select sa.analysis_area_id, sa.service_area_id\n"
			+ "from selected_areas sa\n"
			+ "join intersected_areas isa on isa.id = sa.service_area_id and isa.area = sa.area \n", nativeQuery = true)
	@Transactional
	List<ServiceArea> queryServiceAreasforForAnalysis(
			@Param("analysisAreaIds") Collection<Integer> analysisAreaIds,
			@Param("serviceLayerId") int serviceLayerId,
			@Param("analysisLayerId") int analysisLayerId);

}
