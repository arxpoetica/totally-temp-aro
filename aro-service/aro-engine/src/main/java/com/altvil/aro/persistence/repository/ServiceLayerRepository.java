package com.altvil.aro.persistence.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.persistence.repository.user_data.SourceLocationEntity;

@Repository
public interface ServiceLayerRepository extends
		JpaRepository<ServiceLayer, Integer> {
	
	
	//Temp fix until @Transactional Fixed
	@Query(value = "select sl.dataSource.sourceLocationEntities from ServiceLayer sl where sl.id = :serviceLayerId ")
	List<SourceLocationEntity> querySourceLocationEntityForServiceLayer(@Param("serviceLayerId") int serviceLayerId);
	
	@Transactional
	@Modifying
	@Query(value = "WITH new_plans AS (\n" + 
			"INSERT INTO client.plan (service_layer_id, name, plan_type, parent_plan_id, wirecenter_id, area_name, area_centroid, area_bounds, created_at, updated_at)\n" + 
			"SELECT\n" + 
			"	sa.service_layer_id,\n" + 
			"	'root_' || code,\n" + 
			"	'H',\n" + 
			"	NULL,\n" + 
			"	sa.id,\n" + 
			"	sa.code,\n" + 
			"	st_centroid(geom),\n" + 
			"	sa.geom,\n" + 
			"	NOW(),\n" + 
			"	NOW()\n" + 
			"FROM client.service_area sa\n" + 
			"WHERE sa.service_layer_id = :serviceLayerId\n" + 
			"ORDER BY sa.id\n" + 
			"RETURNING  id, wirecenter_id, area_centroid\n" + 
			")\n" + 
			",\n" + 
			"new_cos AS (\n" + 
			"	INSERT INTO client.network_nodes (plan_id, node_type_id, geog, geom)\n" + 
			"	SELECT\n" + 
			"		p.id, 1, CAST(p.area_centroid AS Geography), p.area_centroid\n" + 
			"	FROM new_plans p\n" + 
			"	RETURNING id, plan_id\n" + 
			")\n" + 
			"SELECT id, plan_id FROM new_cos", nativeQuery = true)
	public List<Object[]> updateServiceLayerEquipment(@Param("serviceLayerId") int serviceLayerId);
	
	
	
	
	@Query(value = "SELECT\n" + "	service_layer_id,\n"
			+ "	entity_category_id\n" + "FROM\n"
			+ "	client.service_layer_entity_category c\n"
			+ "JOIN client.system_rule r\n" + "	ON r.id = c.system_rule_id \n"
			+ "WHERE name='system_defaults'", nativeQuery = true)
	List<Object[]> queryMappedCategories();

	@Query(value = "SELECT\n" + "	service_layer_id,\n" + "	default_priority\n"
			+ "FROM\n" + "	client.service_layer_priority c\n"
			+ "JOIN client.system_rule r\n" + "	ON r.id = c.system_rule_id \n"
			+ "WHERE name='system_defaults'", nativeQuery = true)
	List<Object[]> queryMappedPriorities();

	@Query( "select sl from ServiceLayer sl where sl.dataSource.userId = :userId")
	Collection<ServiceLayer> getByUserId(@Param("userId") int userId);

	@Query( "select sl from ServiceLayer sl where sl.dataSource.userId = :userId and sl.id = :id")
	ServiceLayer getByUserIdAndId(@Param("userId") int userId, @Param("id") int id);

	Collection<ServiceLayer> findByUserDefined(boolean userDefined);



}
