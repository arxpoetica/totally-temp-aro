package com.altvil.aro.persistence.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.altvil.aro.model.ServiceLayer;

@Repository
public interface ServiceLayerRepository extends
		JpaRepository<ServiceLayer, Integer> {

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
