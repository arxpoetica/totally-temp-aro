package com.altvil.aro.service.cu.execute.impl;

import java.io.Serializable;

import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.execute.JobProcessedEvent;
import com.altvil.aro.service.cu.execute.JobProgressListener;

public class JobListenerAdaptor<R extends Serializable> implements
		JobProgressListener<AroGridResult<R>> {

	private JobProgressListener<R> delegate;

	public JobListenerAdaptor(JobProgressListener<R> delegate) {
		super();
		this.delegate = delegate;
	}

	@Override
	public void onJobProgress(JobProcessedEvent<AroGridResult<R>> event) {
		AroGridResult<R> result = event.getJob();
		if (result.isValid()) {
			delegate.onJobProgress(new JobProcessedEvent<>(result.getValue(),
					event.getCurrentCount()));
		} else {
			delegate.onException(result.getCacheQuery(),
					result.getExceptionMessage());
		}
	}

	@Override
	public void onJobsCompleted(long noJobs) {
		delegate.onJobsCompleted(noJobs);
	}

	@Override
	public void onJobsCancelled() {
		delegate.onJobsCancelled();
	}

	@Override
	public void onException(CacheQuery query, String message) {
		delegate.onException(query, message);
	}

	@Override
	public void onException(Throwable message) {
		delegate.onException(message);
	}

}