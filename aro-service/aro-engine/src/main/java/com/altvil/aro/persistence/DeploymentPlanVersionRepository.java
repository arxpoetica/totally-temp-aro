package com.altvil.aro.persistence;

import java.util.Date;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.altvil.aro.model.DeploymentPlanVersionEntity;
import com.altvil.aro.model.DeploymentPlanVersionKey;

@Repository
public interface DeploymentPlanVersionRepository extends
		JpaRepository<DeploymentPlanVersionEntity, DeploymentPlanVersionKey> {

	Set<DeploymentPlanVersionEntity> findByLastUpdatedAfter(Date date);


}
