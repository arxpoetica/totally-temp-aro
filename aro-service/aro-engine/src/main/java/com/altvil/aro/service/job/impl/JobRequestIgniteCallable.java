package com.altvil.aro.service.job.impl;

import java.security.Principal;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;

import org.apache.ignite.IgniteCompute;
import org.apache.ignite.lang.IgniteCallable;

import com.altvil.aro.service.job.JobService.JobRequest;

public class JobRequestIgniteCallable<T> extends JobRequest<T> {

	public JobRequestIgniteCallable(Principal creator, IgniteCompute computeGrid, IgniteCallable<T> igniteCallable) {
		super(creator, new Callable<T>() {
			@Override
			public T call() throws Exception {
				return computeGrid.call(igniteCallable);
			}
		});
	}
	
	public JobRequestIgniteCallable(Principal creator, ExecutorService computeGrid, Callable<T> igniteCallable) {
		super(creator, new Callable<T>() {
			@Override
			public T call() throws Exception {
				return computeGrid.submit(igniteCallable).get() ;
			}
		});
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.job.JobService.JobRequest#setMetaIdentifiers(java.util.Map)
	 */
	@Override
	public JobRequestIgniteCallable<T> setMetaIdentifiers(Map<String, Object> metaIdentifiers) {
		super.setMetaIdentifiers(metaIdentifiers);
		return this;
	}

	
}
