package com.altvil.aro.service.cu.cache;

import com.altvil.aro.service.cu.cache.query.CacheKey;
import com.altvil.aro.service.cu.resource.ResourceVersion;

public interface SimpleCache {
	CacheType getCacheType();

	CacheHandle createCacheHandle(CacheKey key, ResourceVersion resourceVersion);
}
