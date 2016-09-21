package com.altvil.aro.service.cu.execute.impl;

import java.io.Serializable;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.ignite.compute.ComputeTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.cu.ComputeUnit;
import com.altvil.aro.service.cu.ComputeUnitService;
import com.altvil.aro.service.cu.ComputeServiceApi;
import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.execute.JobProgressListener;
import com.altvil.aro.service.cu.execute.Priority;
import com.altvil.aro.service.cu.execute.SpiAroExecutorContext;
import com.altvil.aro.service.cu.spi.SpiComputeUnit;


@Service
public class SpiAroExecutorContextImpl implements SpiAroExecutorContext {

	private static final Logger log = LoggerFactory
			.getLogger(SpiAroExecutorContextImpl.class.getName());

	private ApplicationContext applicationContext;

	private Map<String, ComputeServiceApi> loaderMap = new ConcurrentHashMap<>();

	private ThreadLocal<Boolean> isInGridContext = new ThreadLocal<>();


	@Autowired
	public SpiAroExecutorContextImpl(
			ApplicationContext applicationContext,
			@Value("${job-flow-control-enabled}") boolean jobFlowControlEnabled,
			@Value("${job-flow-max-queries}") int maxQueries) {
		this.applicationContext = applicationContext;
	}
	

	@Override
	public boolean isInGridContext() {
		Boolean context = isInGridContext.get();
		return context == null ? false : context;
	}

	@Override
	public void executeInGrid(Runnable runnable) {
		try {
			isInGridContext.set(true);
			runnable.run();
		} finally {
			isInGridContext.remove();
		}

	}

	@Override
	public SpiComputeUnit getBsaExecutor(String name, String beanClassName) {

		if (!loaderMap.containsKey(beanClassName)) {
			try {
				ComputeServiceApi loader = (ComputeServiceApi) applicationContext
						.getBean(Class.forName(beanClassName));
				loaderMap.put(beanClassName, loader);

			} catch (Throwable err) {
				log.error(err.getMessage(), err);
				throw new RuntimeException(err.getMessage(), err);
			}
		}

		return (SpiComputeUnit) applicationContext.getBean(
				ComputeUnitService.class).getBsaExecutor(name);
	}

	@Override
	public <R extends Serializable> ComputeTask<Collection<CacheQuery>, List<R>> createComputeJob(
			ComputeUnit<R> executor, Priority priority,
			Class<? extends ComputeServiceApi> beanClass) {
		return new RobustBatchGridJob<R>(executor.getName(), priority, beanClass);

	}
	
	@Override
	public <R extends Serializable> ComputeTask<Iterator<CacheQuery>, Long> createComputeJob(
			ComputeUnit<R> executor, Priority priority,
			Class<? extends ComputeServiceApi> beanClass,
			JobProgressListener<R> progressListener) {

		return new RobustStreamingJobProcess<R>(
				beanClass,
				executor.getName(), priority, new JobListenerAdaptor<R>(
						progressListener));

		// return new StreamingJobProcess<R>(getFlowControlStrategy(priority),
		// beanClass, executor.getName(), priority, progressListener);
	}

	

	

}
