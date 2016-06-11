package com.altvil.aro.service.cu.execute;

import java.io.Serializable;

import com.altvil.aro.service.cu.cache.query.CacheQuery;

public interface JobProgressListener<R extends Serializable> {
	
	void onJobProgress(JobProcessedEvent<R> event);
	
	void onJobsCompleted(long noJobs) ;
	
	void onJobsCancelled();
	
	void onException(CacheQuery query, String message) ;
	
	void onException(Throwable message) ;

}
