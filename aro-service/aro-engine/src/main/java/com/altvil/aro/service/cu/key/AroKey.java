package com.altvil.aro.service.cu.key;

import org.apache.ignite.cache.affinity.AffinityKeyMapped;

import com.altvil.aro.service.cu.version.VersionType;

public interface AroKey {

	AroKey toKey(VersionType vt);

	@AffinityKeyMapped
	public abstract Integer getServiceAreaId();

	public abstract Long getDeploymentPlanId();

	public abstract String getCompositeKey();

}
