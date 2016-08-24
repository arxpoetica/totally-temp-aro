package com.altvil.aro.persistence.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.altvil.aro.model.ServiceLayer;

public interface ServiceLayerRepository extends
		JpaRepository<ServiceLayer, Integer> {

	@Query(value = 
			"SELECT\n" + 
			"	service_layer_id,\n" + 
			"	entity_category_id\n" + 
			"FROM\n" + 
			"	client.service_layer_entity_category c\n" + 
			"JOIN client.system_rule r\n" + 
			"	ON r.id = c.system_rule_id \n" + 
			"WHERE name=:systemRule", nativeQuery = true)
	List<Object[]> queryMappedCategories(@Param("systemRule") String systemRule) ;
	
	
	@Query(value = 
			"SELECT\n" + 
			"	service_layer_id,\n" + 
			"	default_priority\n" + 
			"FROM\n" + 
			"	client.service_layer_priority c\n" + 
			"JOIN client.system_rule r\n" + 
			"	ON r.id = c.system_rule_id \n" + 
			"WHERE name=:systemRule", nativeQuery = true)
	List<Object[]> queryMappedPriorities(@Param("systemRule") String systemRule) ;
	
}
