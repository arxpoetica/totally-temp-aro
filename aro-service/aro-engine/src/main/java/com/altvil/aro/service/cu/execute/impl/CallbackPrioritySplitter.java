package com.altvil.aro.service.cu.execute.impl;

import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import org.apache.ignite.IgniteException;
import org.apache.ignite.compute.ComputeJob;
import org.apache.ignite.compute.ComputeJobResult;
import org.apache.ignite.compute.ComputeJobResultPolicy;
import org.apache.ignite.compute.ComputeJobSibling;
import org.apache.ignite.compute.ComputeTaskNoResultCache;
import org.apache.ignite.compute.ComputeTaskSession;
import org.apache.ignite.compute.ComputeTaskSessionFullSupport;
import org.apache.ignite.compute.ComputeTaskSplitAdapter;
import org.apache.ignite.resources.TaskSessionResource;

import com.altvil.aro.service.cu.ComputeServiceApi;
import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.execute.JobProcessedEvent;
import com.altvil.aro.service.cu.execute.JobProgressListener;
import com.altvil.aro.service.cu.execute.Priority;


@SuppressWarnings("serial")
@ComputeTaskSessionFullSupport
@ComputeTaskNoResultCache
public class CallbackPrioritySplitter<R extends Serializable> extends
		ComputeTaskSplitAdapter<Collection<CacheQuery>, List<R>> {

	private Class<? extends ComputeServiceApi> nodeLoaderClass;
	private String cacheName;
	private Priority priority;

	@TaskSessionResource
	private transient ComputeTaskSession taskSes;
	private transient JobProgressListener<R> progressListener;
	private transient AtomicInteger count = new AtomicInteger();

	public CallbackPrioritySplitter(String cacheName, Priority priority,
			Class<? extends ComputeServiceApi> nodeLoaderClass,
			JobProgressListener<R> progressListener) {
		super();
		this.cacheName = cacheName;
		this.priority = priority;
		this.nodeLoaderClass = nodeLoaderClass;
		this.progressListener = progressListener;
	}

	public void cancel() {
		for (ComputeJobSibling s : taskSes.getJobSiblings()) {
			s.cancel();
		}
	}

	@Override
	public ComputeJobResultPolicy result(ComputeJobResult res,
			List<ComputeJobResult> rcvd) throws IgniteException {

		if (res.getException() == null && progressListener != null) {
			rcvd.forEach(result -> {
				progressListener.onJobProgress(new JobProcessedEvent<R>(result
						.getJob(), count.addAndGet(1)));
			});
		}

		return super.result(res, rcvd);
	}

	@SuppressWarnings({ "unchecked", "rawtypes" })
	@Override
	public List<R> reduce(List<ComputeJobResult> results)
			throws IgniteException {
		progressListener.onJobsCompleted(results.size());

		return (List) results.stream().map(ComputeJobResult::getData)
				.collect(Collectors.toList());
	}

	@Override
	protected Collection<? extends ComputeJob> split(int gridSize,
			Collection<CacheQuery> inputs) throws IgniteException {

		taskSes.setAttribute("grid.task.priority", priority.ordinal() * 10);

		return inputs
				.stream()
				.map(q -> new AroGridJob<R>(q, cacheName, nodeLoaderClass
						.getName())).collect(Collectors.toList());
	}
}

