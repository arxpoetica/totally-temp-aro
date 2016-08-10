package com.altvil.aro.service.cu.execute.impl;

import org.apache.ignite.IgniteException;
import org.apache.ignite.cache.affinity.AffinityKeyMapped;
import org.apache.ignite.compute.ComputeJob;
import org.apache.ignite.compute.ComputeTaskSessionFullSupport;
import org.apache.ignite.resources.SpringApplicationContextResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;

import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.execute.SpiAroExecutorContext;

@SuppressWarnings("serial")
@ComputeTaskSessionFullSupport
public class AroGridJob<T> implements ComputeJob {

	private static final Logger log = LoggerFactory.getLogger(AroGridJob.class
			.getName());

	private CacheQuery cacheQuery;
	private String cacheName;
	private String beanLoaderClassName;

	// @SpringResource(resourceName = "spiBsaExecutorContext")
	// @SpringResource(resourceName = "applicationContext")
	@SpringApplicationContextResource
	protected transient ApplicationContext appCtx;
	// private transient SpiBsaExecutorContext spiBsaExecutorContext;

	@SuppressWarnings("unused")
	private boolean cancelled = false;
	private Object result = null;

	public AroGridJob(CacheQuery cacheQuery, String cacheName,
			String beanLoaderClassName) {
		super();
		this.cacheQuery = cacheQuery;
		this.cacheName = cacheName;
		this.beanLoaderClassName = beanLoaderClassName;
	}

	@AffinityKeyMapped
	public int serviceAreaId() {
		return cacheQuery.getServiceAreaId();
	}

	@Override
	public void cancel() {
		// TODO HT Propergate
		this.cancelled = true;
	}

	@Override
	public Object execute() throws IgniteException {
		try {
			SpiAroExecutorContext executorContext = appCtx
					.getBean(SpiAroExecutorContext.class);
			executorContext.executeInGrid(() -> {
				result = executorContext.getBsaExecutor(cacheName,
						beanLoaderClassName).nodeLoad(cacheQuery);

			});
		} catch (Throwable throwable) {
			log.error(throwable.getMessage(), throwable);
			throw new IgniteException(throwable.getMessage(), throwable);
		}

		return result;
	}

}