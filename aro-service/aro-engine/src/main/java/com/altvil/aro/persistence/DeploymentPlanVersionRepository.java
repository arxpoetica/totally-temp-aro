package com.altvil.aro.persistence;

import java.util.Date;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.altvil.aro.model.ServiceAreaVersionEntity;
import com.altvil.aro.model.ServiceAreaAndPlanVersionKey;

@Repository
public interface DeploymentPlanVersionRepository extends
		JpaRepository<ServiceAreaVersionEntity, ServiceAreaAndPlanVersionKey> {

	Set<ServiceAreaVersionEntity> findByLastUpdatedAfter(Date date);


}
