package com.altvil.aro.service.job.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import javax.annotation.Resource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.job.Job.Id;
import com.altvil.aro.service.job.JobService;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

@Service
public class JobServiceImpl implements JobService {

	private static final Logger	LOG	= LoggerFactory.getLogger(JobServiceImpl.class.getName());

	private Map<Job.Id, Job<?>>	map	= Collections.synchronizedMap(new HashMap<>());
	
	@Resource(name="myExecutor")
	private	ThreadPoolTaskExecutor defaultService;

	public JobServiceImpl() {
	}

	@SuppressWarnings("unchecked")
	@Override
	public Job<?> get(Id id) {
		return map.get(id);
	}

	@Override
	public Collection<Job<?>> getRemainingJobs() {
		return new ArrayList<>(map.values());
	}

	public class JobAdapter<T> implements Callable<T>, Job<T> {
		private final Future<T> future;
		private final Callable<T> task;

		public String toString() {
			return Job.class.getSimpleName() + "(id: " + getId() + ", isDone: " + future.isDone() + ", isCancelled: "
					+ future.isCancelled() + ")";
		}

		@Override
		public boolean cancel(boolean mayInterruptIfRunning) {
			return future.cancel(mayInterruptIfRunning);
		}

		@Override
		public boolean isCancelled() {
			return future.isCancelled();
		}

		@Override
		public boolean isDone() {
			return future.isDone();
		}

		@Override
		public T get() throws InterruptedException, ExecutionException {
			return future.get();
		}

		@Override
		public T get(long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException {
			return future.get(timeout, unit);
		}

		private Job.Id	   id;
		private final Date scheduledTime;
		private  Date startedTime;
		private Date	   completedTime;

		JobAdapter(Builder<T> builder) {
			id = new JobIdImpl(builder.getMetaIdentifiers());
			this.task = builder.getCallable();
			scheduledTime = new Date();
			startedTime = null;
			completedTime = null;
			
			if (builder.getExecutorService() == null) {
				future = defaultService.submit(this);
			} else {
			future = builder.getExecutorService().submit(this);
			}
		}

		JobAdapter(Map<String, Object> meta, Callable<T> task, ExecutorService executorService) {
			id = new JobIdImpl(meta);
			this.task = task;
			scheduledTime = new Date();
			startedTime = null;
			completedTime = null;
			
			future = executorService.submit(this);
		}

		JobAdapter(Map<String, Object> meta, Callable<T> task) {
			id = new JobIdImpl(meta);
			this.task = task;
			scheduledTime = new Date();
			startedTime = null;
			completedTime = null;
			
			future = defaultService.submit(this);
		}

		@JsonDeserialize(using = JobIdDeserializer.class)
		void setId(Job.Id id) {
			this.id = id;
		}

		@Override
		@JsonSerialize(using = JobIdSerializer.class)
		public Id getId() {
			return id;
		}

		@Override
		public Date getStartedTime() {
			return startedTime;
		}

		void setStartedTime(Date startedTime) {
			this.startedTime = startedTime;
		}

		@Override
		public Date getScheduledTime() {
			return scheduledTime;
		}

		@Override
		public Date getCompletedTime() {
			return completedTime;
		}

		void initCompletedTime() {
			completedTime = new Date();
		}

		@Override
		public T call() throws Exception {
			try {
				startedTime = new Date();
				
				return task.call();
			} finally {
				completedTime = new Date();
			}
		}
	}
	
	

	@Override
	public <T> Job<T> submit(Builder<T> builder) {
		JobAdapter<T> newJob = new JobAdapter<T>(builder);
		
		map.put(newJob.getId(), newJob);

		LOG.trace("{} added to service", newJob);
		
		return newJob;
	}

//	@Override
//	public <T> Job<T> submit(Map<String, Object> metaId, Callable<T> task, ExecutorService executorService) {
//		JobAdapter<T> newJob = new JobAdapter<T>(metaId, task, executorService);
//		
//		map.put(newJob.getId(), newJob);
//
//		LOG.trace("{} added to service", newJob);
//		
//		return newJob;
//	}
//
//	@Override
//	public <T> Job<T> submit(Map<String, Object> metaId, Callable<T> task) {
//		JobAdapter<T> newJob = new JobAdapter<T>(metaId, task);
//		
//		map.put(newJob.getId(), newJob);
//
//		LOG.trace("{} added to service", newJob);
//		
//		return newJob;
//	}

//	@Override
//	public <T> Job<T> submit(Callable<T> task, ExecutorService executorService) {
//		return submit((Map<String, Object>) null, task, executorService);
//	}
//
//	@Override
//	public <T> Job<T> submit(Map<String, Object> metaId, Runnable task, T result, ExecutorService executorService) {
//		return submit((Map<String, Object>) metaId, () -> {task.run(); return result;}, executorService);
//	}
//
//	@Override
//	public Job<?> submit(Map<String, Object> metaId, Runnable task, ExecutorService executorService) {
//		return submit(metaId, task, (Void) null, executorService);
//	}
//
//	@Override
//	public <T> Job<T> submit(Runnable task, T result, ExecutorService executorService) {
//		return submit((Map<String, Object>)null, task, result, executorService);
//	}
//
//	@Override
//	public Job<?> submit(Runnable task, ExecutorService executorService) {
//		return submit((Map<String, Object>)null, task, (Void) null, executorService);
//	}
//
//	@Override
//	public <T> Job<T> submit(Callable<T> task) {
//		return submit((Map<String, Object>) null, task);
//	}

//	@Override
//	public <T> Job<T> submit(Map<String, Object> metaId, Runnable task, T result) {
//		return submit((Map<String, Object>) null, () -> {task.run(); return result;});
//	}
//
//	@Override
//	public Job<?> submit(Map<String, Object> metaId, Runnable task) {
//		return submit(metaId, task, (Void) null);
//	}
//
//	@Override
//	public <T> Job<T> submit(Runnable task, T result) {
//		return submit((Map<String, Object>)null, task, result);
//	}
//
//	@Override
//	public Job<?> submit(Runnable task) {
//		return submit((Map<String, Object>)null, task, (Void) null);
//	}

}
