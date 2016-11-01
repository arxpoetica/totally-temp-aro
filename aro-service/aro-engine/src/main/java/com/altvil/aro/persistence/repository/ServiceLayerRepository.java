package com.altvil.aro.persistence.repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;

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
	@Query(value = "WITH selected_layer AS (\n" + 
			"	select *\n" + 
			"	FROM client.service_layer \n" + 
			"	WHERE id = :serviceLayerId\n" + 
			")\n" + 
			",\n" + 
			"new_plans AS (\n" + 
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
			"JOIN selected_layer sl\n" + 
			"	ON sl.id = sa.service_layer_id\n" + 
			"ORDER BY sa.id\n" + 
			"RETURNING  id, wirecenter_id, service_layer_id\n" + 
			")\n" + 
			",\n" + 
			"new_cos AS (\n" + 
			"	INSERT INTO client.network_nodes (plan_id, node_type_id, geog, geom)\n" + 
			"	SELECT\n" + 
			"		np.id, sle.entity_category_id, CAST(sle.point AS Geography), sle.point\n" + 
			"	FROM selected_layer sl\n" + 
			"	JOIN user_data.data_source ds\n" + 
			"		ON ds.id =  sl.data_source_id\n" + 
			"	JOIN user_data.source_location_entity sle\n" + 
			"		ON sle.data_source_id = ds.id\n" + 
			"	JOIN client.service_area sa\n" + 
			"		ON sa.service_layer_id = sl.id\n" + 
			"		AND ST_Contains(sa.geom, sle.point)\n" + 
			"	JOIN new_plans np\n" + 
			"		ON np.wirecenter_id = sa.id \n" + 
			"	WHERE sle.entity_category_id=1\n" + 
			"\n" + 
			"	RETURNING id, plan_id\n" + 
			")\n" + 
			"SELECT id, plan_id FROM new_cos", nativeQuery = true)
	public List<Object[]> updateServiceLayerEquipment(@Param("serviceLayerId") int serviceLayerId);
	
	
	@Transactional
	@Modifying
	@Query(value = "WITH selected_service_layer AS (\n" + 
			"	SELECT *\n" + 
			"	FROM client.service_layer \n" + 
			"	WHERE id = :serviceLayerId\n" +
			")\n" + 
			",\n" + 
			"user_towers as(\n" + 
			" SELECT nextval('aro.locations_id_seq'::regclass) as location_id,  nextval('aro.towers_id_seq'::regclass) as tower_id, sle.*, st.statefp \n" + 
			" FROM selected_service_layer sl\n" + 
			"	user_data.source_location_entity sle on sle.data_source_id = sl.data_source_id\n" + 
			"    inner join aro.states st\n" + 
			"    on\n" + 
			"        ST_CONTAINS(st.geom, sle.point)\n" + 
			"        and sle.location_class = 2     \n" + 
			")\n" +
			",\n" + 
			"locations AS (\n" + 
			"    INSERT INTO aro.locations(\n" + 
			"      id, \n" + 
			"      state,\n" + 
			"      lat,\n" + 
			"      lon,\n" + 
			"      geog,\n" + 
			"      total_towers,\n" + 
			"      geom),\n" + 
			"    ) select location_id, statefp, lat, \"long\", cast(point as geography), 1, point  from user_towers ut\n" + 
			")    \n" + 
			"INSERT INTO aro.towers ( \n" + 
			" id,\n" + 
			"  location_id,\n" + 
			"  parcel_state,\n" + 
			"  lat,\n" + 
			"  lon,\n" + 
			"  geog,\n" + 
			"  geom,\n" + 
			"  data_source_id, --integer\n" +
			" attributes " +
			"  )\n" + 
			"SELECT \n" + 
			"	tower_id,\n" + 
			"	statefp,\n" + 
			"	lat,\n" + 
			"	\"long\",\n" + 
			"	cast(point as geography),\n" + 
			"	point, " +
			"data_source_id," +
			"custom_attributes \n" +
			"FROM user_towers ut\n" + 
			"  ", nativeQuery = true)
	void updateServiceLayerTowers(@Param("serviceLayerId") int serviceLayerId);
	
	
	
	
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

	@Query("select sl from ServiceLayer sl where sl.id in :ids")
	Collection<ServiceLayer> getByIds(@Param("ids") Set<Integer> ids);
}
