package com.altvil.aro.service.cu.cache;

import java.util.Collection;

import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.key.AroKey;

public interface CacheStrategy {
	CacheQuery toCacheQuery(AroKey key);

	Collection<CacheQuery> getPreCacheQueries();
}
