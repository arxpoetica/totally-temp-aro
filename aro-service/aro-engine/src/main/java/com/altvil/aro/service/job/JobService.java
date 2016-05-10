package com.altvil.aro.service.job;

import java.security.Principal;
import java.util.Collection;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.FutureTask;

import com.altvil.aro.service.job.Job.Id;

/**
 * A light-weight wrapper for tracking the execution of asynchronous tasks. Each
 * job's scheduled, started, and stopped times will be set as they become
 * available.
 * 
 * @author Kevin
 *
 */
public interface JobService {
	<T> Job<T> get(Id id);

	Collection<Job<?>> getRemainingJobs();

	<T> Job<T> submit(JobRequest<T> request);

	abstract class JobRequest<T> extends FutureTask<T> implements Job<T> {
		private final Principal creator;
		private Map<String, Object>	metaIdentifiers;
		private Job.Id id;
		private Date scheduledTime;
		private Date startedTime = null;
		private Date completedTime = null;
		

	    /**
	     * Creates a subclass of {@code FutureTask} that will, upon running, execute the
	     * given {@code Callable}.
	     *
	     * @param creator principal
	     * @param  callable the callable task
	     * @throws NullPointerException if the callable is null
	     */
		public JobRequest(Principal creator, Callable<T> callable) {
			super(callable);
			this.creator = creator;
		}
		
	    /**
	     * Creates a subclass of {@code FutureTask} that will, upon running, execute the
	     * given {@code Runnable}, and arrange that {@code get} will return the
	     * given result on successful completion.
	     *
	     * @param creator principal
	     * @param runnable the runnable task
	     * @param result the result to return on successful completion. If
	     * you don't need a particular result, consider using
	     * constructions of the form:
	     * {@code Future<?> f = new FutureTask<Void>(runnable, null)}
	     * @throws NullPointerException if the runnable is null
	     */
		public JobRequest(Principal creator, Runnable runnable, T artificialResult) {
			super(runnable, artificialResult);
			this.creator = creator;
		}

		public Principal getCreator() {
			return creator;
		}

		public Map<String, Object> getMetaIdentifiers() {
			return metaIdentifiers;
		}

		public JobRequest<T> setMetaIdentifiers(Map<String, Object> metaIdentifiers) {
			this.metaIdentifiers = metaIdentifiers;

			return this;
		}
		
		public void scheduleAsJob(Job.Id jobId) {
			this.scheduledTime = new Date();
			this.id = jobId;
		}
		
		/* 
		 * If subclass overrides this method, it MUST call super.run()
		 * 
		 * @see java.util.concurrent.FutureTask#run()
		 */
		@Override
		public void run() {
			this.startedTime = new Date();
			super.run();
		}

		/*
	     * Protected method invoked when this task transitions to state
	     * {@code isDone} (whether normally or via cancellation). The
	     * default implementation does nothing.  Subclasses may override
	     * this method to invoke completion callbacks or perform
	     * bookkeeping. Note that you can query status inside the
	     * implementation of this method to determine whether this task
	     * has been cancelled.
	     * 
	     * If subclass overrides this method, it should call super.done()
	     * 
		 * @see java.util.concurrent.FutureTask#done()
		 */
		@Override
		protected void done() {
			this.completedTime = new Date();
			super.done();
		}

		@Override
		public Id getId() {
			return id;
		}

		@Override
		public Date getScheduledTime() {
			return scheduledTime;
		}
		
		@Override
		public Date getStartedTime() {
			return startedTime;
		}

		@Override
		public Date getCompletedTime() {
			return completedTime;
		}
		
		public String toString() {
			return this.getClass().getSimpleName() + "(id: " + getId() + ", creator: " + creator + ", isDone: " + this.isDone() + ", isCancelled: "
					+ this.isCancelled() + ")";
		}
	}
}
