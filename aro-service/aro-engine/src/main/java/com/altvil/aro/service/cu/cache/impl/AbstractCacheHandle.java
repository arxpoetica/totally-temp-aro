package com.altvil.aro.service.cu.cache.impl;

import com.altvil.aro.service.cu.cache.CacheHandle;
import com.altvil.aro.service.cu.cache.query.CacheKey;

public abstract class AbstractCacheHandle implements CacheHandle {

	private CacheKey cacheKey;
	private String scopedKey;

	public AbstractCacheHandle(CacheKey cacheKey) {
		super();
		this.cacheKey = cacheKey;
	}

	@Override
	public CacheKey getCacheKey() {
		return cacheKey;
	}

	public long getServiceAreaId() {
		return cacheKey.getServiceAreaId();
	}

	public String getScopedKey() {
		if (scopedKey == null) {
			scopedKey = cacheKey.getScopedKey();
		}
		return scopedKey;
	}

	public Long getDeploymentPlanId() {
		return cacheKey.getBsaKey().getDeploymentPlanId();
	}

}
