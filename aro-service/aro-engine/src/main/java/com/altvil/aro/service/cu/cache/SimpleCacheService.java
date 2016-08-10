package com.altvil.aro.service.cu.cache;

import org.apache.ignite.cache.CacheMode;
import org.springframework.stereotype.Service;

@Service
public interface SimpleCacheService  {
	
	public SimpleCache createPersistenceCache(String name) ;
	public SimpleCache createMemoryCache(String name, int size, CacheMode cacheMode, boolean binaryConnvert) ;
}
