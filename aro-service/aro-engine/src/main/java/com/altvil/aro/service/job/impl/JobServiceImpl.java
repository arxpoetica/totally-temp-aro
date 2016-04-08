package com.altvil.aro.service.job.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

	// TBD: Do we want to subclass SimpleForwardingFuture (i.e. Do we want a
	// dependency on quava for just this)?
	public class JobAdapter<T> implements Job<T> {
		private final Future<T> future;

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
		private Date	   completedTime;

		JobAdapter(Map<String, Object> meta, Future<T> future) {
			id = new JobIdImpl(meta);
			this.future = future;
			scheduledTime = new Date();
			completedTime = null;
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
	}

	@Override
	public <T> Job<T> add(Future<T> future) {
		return add(null, future);
	}

	/**
	 * Create a new job by adding its future to the job service.
	 * 
	 * @param meta
	 *            Optional map of identifiers that will be included in the job's
	 *            Id. NOTE: These identifiers are not used in the equals and
	 *            hashCode functions.
	 * @param future
	 *            The computation that is identified by the new job.
	 */
	@Override
	public <T> Job<T> add(Map<String, Object> meta, Future<T> future) {
		Job<T> newJob = new JobAdapter<T>(meta, future);

		map.put(newJob.getId(), newJob);

		LOG.trace("{} added to service", newJob);

		/*
		 * TODO Add a thenAccept that pushes the completed job into the outgoing
		 * websocket(s).
		 */
		/*
		 * TODO We need a mechanism to remove a job from the map. There must be
		 * a delay between when the job completes and when it is removed.
		 */
		CompletableFuture.supplyAsync(() -> {
			try {
				newJob.get();
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} return newJob;
		}).thenAccept((job) -> ((JobAdapter<?>) job).initCompletedTime());

		return newJob;
	}
}
