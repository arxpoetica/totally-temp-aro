package com.altvil.aro.service.job.impl;

import java.security.Principal;
import java.util.Map;
import java.util.concurrent.Callable;

import com.altvil.aro.service.job.JobService.JobRequest;

public class JobRequestLocal<T> extends JobRequest<T> {

	public JobRequestLocal(Principal creator, Callable<T> callable) {
		super(creator, callable);
	}

	public JobRequestLocal(Principal creator, Runnable runnable, T artificialResult) {
		super(creator, runnable, artificialResult);
	}


	/* (non-Javadoc)
	 * @see com.altvil.aro.service.job.JobService.JobRequest#setMetaIdentifiers(java.util.Map)
	 */
	@Override
	public JobRequestLocal<T> setMetaIdentifiers(Map<String, Object> metaIdentifiers) {
		super.setMetaIdentifiers(metaIdentifiers);
		return this;
	}
}
