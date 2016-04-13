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
	
    <T> Job<T> submit(Callable<T> task);
    <T> Job<T> submit(Callable<T> task, ExecutorService executorService);
    <T> Job<T> submit(Map<String, Object>metaId, Callable<T> task);
    <T> Job<T> submit(Map<String, Object>metaId, Callable<T> task, ExecutorService executorService);
    Job<?> submit(Map<String, Object>metaId, Runnable task);
    Job<?> submit(Map<String, Object>metaId, Runnable task, ExecutorService executorService);
	
    <T> Job<T> submit(Map<String, Object>metaId, Runnable task, T result);
    <T> Job<T> submit(Map<String, Object>metaId, Runnable task, T result, ExecutorService executorService);
    Job<?> submit(Runnable task);
    Job<?> submit(Runnable task, ExecutorService executorService);
    <T> Job<T> submit(Runnable task, T result);
    <T> Job<T> submit(Runnable task, T result, ExecutorService executorService);
}
