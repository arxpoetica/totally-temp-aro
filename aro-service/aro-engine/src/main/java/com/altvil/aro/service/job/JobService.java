package com.altvil.aro.service.job;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;

import com.altvil.aro.service.job.Job.Id;

/**
 * A light-weight wrapper for tracking the execution of asynchronous tasks. Each job's scheduled, started, and stopped times will be set as they become available.
 * @author Kevin
 *
 */
public interface JobService {
	<T> Job<T> get(Id id);
	Collection<Job<?>> getRemainingJobs();
	
    <T> Job<T> submit(Builder<T> builder);
    
    class Builder<T> {
    	private ExecutorService executorService;
    	private Callable<T> callable;
    	private Map<String, Object> metaIdentifiers;
    	
		public ExecutorService getExecutorService() {
			return executorService;
		}
		public Builder<T> setExecutorService(ExecutorService executorService) {
			this.executorService = executorService;
			
			return this;
		}
		public Callable<T> getCallable() {
			return callable;
		}
		public Builder<T> setCallable(Callable<T> callable) {
			this.callable = callable;
			
			return this;
		}
		public Map<String, Object> getMetaIdentifiers() {
			return metaIdentifiers;
		}
		public Builder<T> setMetaIdentifiers(Map<String, Object> metaIdentifiers) {
			this.metaIdentifiers = metaIdentifiers;
			
			return this;
		}
    }
}
