package com.altvil.aro.service.job;

import java.security.Principal;
import java.util.Collection;
import java.util.Map;

import org.apache.ignite.IgniteCompute;
import org.apache.ignite.lang.IgniteCallable;

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

	<T> Job<T> submit(Builder<T> builder);

	class Builder<T> {
		private final Principal		creator;
		private IgniteCompute		computeGrid;
		private IgniteCallable<T>	callable;
		private Map<String, Object>	metaIdentifiers;

		public Builder(Principal creator) {
			this.creator = creator;
		}

		public Principal getCreator() {
			return creator;
		}

		public IgniteCompute getComputeGrid() {
			return computeGrid;
		}

		public Builder<T> setComputeGrid(IgniteCompute grid) {
			this.computeGrid = grid;

			return this;
		}

		public IgniteCallable<T> getCallable() {
			return callable;
		}

		public Builder<T> setCallable(IgniteCallable<T> callable) {
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
