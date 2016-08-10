package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.DeploymentPlanCacheEntity;
import com.altvil.aro.model.DeploymentPlanCacheKey;

@Repository
public interface DeploymentPlanCacheRepository extends
		JpaRepository<DeploymentPlanCacheEntity, DeploymentPlanCacheKey> {

	@Transactional
	@Query(value = "select cache_data from network.deployment_plan_cache c where c.service_area_id=:serviceAreaId and c.deployment_plan_id=:deploymentPlanId and c.cache_type=:key", nativeQuery = true)
	byte[] queryBlobData(@Param("serviceAreaId") int serviceAreaId,
			@Param("deploymentPlanId") long deploymentPlanId,
			@Param("key") String key);

	@Modifying
	@Transactional
	@Query(value = "update network.deployment_plan_cache set optlock=:optLock + 1, deployment_version=:deploymentVersion, location_version=:locationVersion, cache_data = :blob, length = :length where service_area_id=:serviceAreaId and deployment_plan_id=:deploymentPlanId and cache_type=:key and optlock=:optLock", nativeQuery = true)
	public void updateDeploymentPlanCacheEntity(
			@Param("serviceAreaId") int serviceAreaId,
			@Param("deploymentPlanId") int deploymentPlanId,
			@Param("key") String key, @Param("optLock") long optLock,
			@Param("deploymentVersion") Long deploymentVersion,
			@Param("locationVersion") Long locationVersion,
			@Param("length") long length, @Param("blob") byte[] blob);

}
