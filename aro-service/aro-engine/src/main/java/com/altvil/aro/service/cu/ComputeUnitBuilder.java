package com.altvil.aro.service.cu;

import java.io.Serializable;
import java.util.Set;
import java.util.function.Function;

import com.altvil.aro.service.cu.cache.CacheStrategy;
import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.version.VersionType;

public interface ComputeUnitBuilder<T extends Serializable> {
	
	
	public enum ExecutionCachePolicy {
		MEMORY,
		PERSISTENCE
	}
	
	//TODO HT Unify into CacheStrategy
	ComputeUnitBuilder<T> setExecutionCachePolicies(Set<ExecutionCachePolicy> policies) ;
	ComputeUnitBuilder<T> setCacheMemoryBinary(boolean storyAsBinary) ;
	ComputeUnitBuilder<T> setCacheMemorySize(int memorySize) ;
	ComputeUnitBuilder<T> setCacheStrategy(CacheStrategy cacheStrategy) ;
	
	ComputeUnitBuilder<T> setVersionTypes(Set<VersionType> versionTypes) ;
	ComputeUnitBuilder<T> setName(String name) ;

	
	ComputeUnitBuilder<T> setCacheLoaderFunc(Function<CacheQuery, ComputeUnitFunction<T>> cacheLoader) ;
	ComputeUnit<T> build() ;

}
