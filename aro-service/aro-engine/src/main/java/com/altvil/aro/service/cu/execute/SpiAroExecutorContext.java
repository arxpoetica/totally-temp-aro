package com.altvil.aro.service.cu.execute;

import java.io.Serializable;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;

import org.apache.ignite.compute.ComputeTask;

import com.altvil.aro.service.cu.ComputeUnit;
import com.altvil.aro.service.cu.ComputeServiceApi;
import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.spi.SpiComputeUnit;

public interface SpiAroExecutorContext {
	

	boolean isInGridContext();

	void executeInGrid(Runnable runnable);

	SpiComputeUnit getBsaExecutor(String name, String beanClassName);
	
	<R extends Serializable> ComputeTask<Collection<CacheQuery>, List<R>> createComputeJob(
			ComputeUnit<R> executor, Priority priority,
			Class<? extends ComputeServiceApi> beanClass);

	<R extends Serializable> ComputeTask<Iterator<CacheQuery>, Long> createComputeJob(
			ComputeUnit<R> executor, Priority priority,
			Class<? extends ComputeServiceApi> beanClass,
			JobProgressListener<R> progressListener);


}
