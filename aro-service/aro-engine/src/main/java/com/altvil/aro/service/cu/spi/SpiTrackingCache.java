package com.altvil.aro.service.cu.spi;

import com.altvil.aro.service.cu.cache.query.CacheQuery;

public interface SpiTrackingCache {
	public Object nodeLoad(CacheQuery cacheQuery);
}
