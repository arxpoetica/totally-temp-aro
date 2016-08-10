package com.altvil.aro.service.cu.cache.impl;

import java.util.ArrayList;
import java.util.Collection;

import com.altvil.aro.service.cu.cache.CacheStrategy;
import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.key.AroKey;

public class DefaultCacheStrategy implements CacheStrategy {

	@Override
	public CacheQuery toCacheQuery(AroKey key) {
		return CacheQuery.build(key.getServiceAreaId(),
				key.getDeploymentPlanId()).build();
	}

	@Override
	public Collection<CacheQuery> getPreCacheQueries() {
		return new ArrayList<>();
	}

}