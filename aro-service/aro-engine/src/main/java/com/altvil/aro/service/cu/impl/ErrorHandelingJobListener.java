package com.altvil.aro.service.cu.impl;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.execute.JobProcessedEvent;
import com.altvil.aro.service.cu.execute.JobProgressListener;

public class ErrorHandelingJobListener<R extends Serializable> implements JobProgressListener<R> {

	private static final Logger log = LoggerFactory
			.getLogger(ErrorHandelingJobListener.class.getName());
	
	private List<String> errorResults = Collections.synchronizedList(new ArrayList<>()) ;
	private List<R> results = Collections.synchronizedList(new ArrayList<>()) ;
	private AtomicBoolean cancelled = new AtomicBoolean(false) ;
	
	@Override
	public void onJobProgress(JobProcessedEvent<R> event) {
		results.add(event.getJob()) ;
	}

	@Override
	public void onJobsCompleted(long noJobs) {
		log.info("onJobsCompleted");
	}

	@Override
	public void onJobsCancelled() {
		cancelled.set(true);
	}

	@Override
	public void onException(CacheQuery query, String message) {
		log.error("Job Failed check logs on query " + query.toString() + " error = " +  message);
		errorResults.add(message) ;
	}

	@Override
	public void onException(Throwable err) {
		log.error(err.getMessage(), err) ;
		errorResults.add(err.getMessage()) ;
	}

	
	public boolean isValid() {
		return errorResults.size() == 0 ;
	}
	
	public Collection<R> getResults() {
		return results ;
	}

}
