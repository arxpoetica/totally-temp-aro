package com.altvil.aro.service.cu;

import java.io.Serializable;
import java.util.Collection;
import java.util.Iterator;

import org.apache.ignite.compute.ComputeTaskFuture;

import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.execute.JobProgressListener;
import com.altvil.aro.service.cu.execute.Priority;

public interface ComputeUnit<T extends Serializable> {

	String getName();

	ComputeTaskFuture<?> gridLoad(Priority priority, Iterator<CacheQuery> queries,
			JobProgressListener<T> listener);

	Collection<T> gridLoad(Priority priority, Collection<CacheQuery> queries);
	
	Collection<T> gridLoad(Priority priority, Collection<CacheQuery> queries, boolean handleErrors);

	T gridLoad(Priority priority, CacheQuery cacheQuery);

}
