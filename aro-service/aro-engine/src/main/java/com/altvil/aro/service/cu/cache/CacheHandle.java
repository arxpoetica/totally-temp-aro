package com.altvil.aro.service.cu.cache;

import com.altvil.aro.service.cu.cache.query.CacheKey;

public interface CacheHandle {

	CacheKey getCacheKey() ;
	
	<T> T tryRead(Class<T> clz) ;
	<T> void write(T value) ;

	
}
