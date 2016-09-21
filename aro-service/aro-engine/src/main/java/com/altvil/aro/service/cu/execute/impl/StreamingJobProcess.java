package com.altvil.aro.service.cu.execute.impl;

import java.io.Serializable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import org.apache.ignite.IgniteException;
import org.apache.ignite.cluster.ClusterNode;
import org.apache.ignite.compute.ComputeJob;
import org.apache.ignite.compute.ComputeJobResult;
import org.apache.ignite.compute.ComputeJobResultPolicy;
import org.apache.ignite.compute.ComputeLoadBalancer;
import org.apache.ignite.compute.ComputeTaskAdapter;
import org.apache.ignite.compute.ComputeTaskContinuousMapper;
import org.apache.ignite.compute.ComputeTaskNoResultCache;
import org.apache.ignite.compute.ComputeTaskSession;
import org.apache.ignite.compute.ComputeTaskSessionFullSupport;
import org.apache.ignite.resources.LoadBalancerResource;
import org.apache.ignite.resources.TaskContinuousMapperResource;
import org.apache.ignite.resources.TaskSessionResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.cu.ComputeServiceApi;
import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.execute.JobProcessedEvent;
import com.altvil.aro.service.cu.execute.JobProgressListener;
import com.altvil.aro.service.cu.execute.Priority;


@SuppressWarnings("serial")
@ComputeTaskSessionFullSupport
@ComputeTaskNoResultCache
public class StreamingJobProcess<R extends Serializable> extends
		ComputeTaskAdapter<Iterator<CacheQuery>, Long> {

	private static final Logger log = LoggerFactory
			.getLogger(StreamingJobProcess.class.getName());

	private Class<? extends ComputeServiceApi> nodeLoaderClass;
	private String cacheName;
	private Priority priority;
	private JobProgressListener<R> progressListener;

	@TaskSessionResource
	private transient ComputeTaskSession taskSes;
	@TaskContinuousMapperResource
	private ComputeTaskContinuousMapper mapper;
	@LoadBalancerResource
	private ComputeLoadBalancer balancer;

	
	private AtomicReference<Iterator<CacheQuery>> itrRef = new AtomicReference<>();

	private transient AtomicInteger count = new AtomicInteger(0);
	private transient AtomicInteger totalCount = new AtomicInteger(0);

	//private int blockCount = 30;

	public StreamingJobProcess(
			Class<? extends ComputeServiceApi> nodeLoaderClass, String cacheName,
			Priority priority, JobProgressListener<R> progressListener) {
		super();
		this.nodeLoaderClass = nodeLoaderClass;
		this.cacheName = cacheName;
		this.priority = priority;
		this.progressListener = progressListener;
	}

	private JobProgressListener<R> getListener() {
		return progressListener;
	}

	@Override
	public Map<? extends ComputeJob, ClusterNode> map(
			List<ClusterNode> subgrid, Iterator<CacheQuery> itr)
			throws IgniteException {

		taskSes.setAttribute("grid.task.priority", priority.ordinal() * 10);

		dispatchRemainingTasks(itr, 40);

		itrRef.set(itr);

		return null;
	}

	private synchronized void dispatchRemainingTasks(Iterator<CacheQuery> itr, int count) {

		if (itr == null || !itr.hasNext()) {
			return;
		}

		// Threaded to allow for flow Control (This can be revisited)
		for (int i = 0; i < count && itr.hasNext(); i++) {
			totalCount.getAndIncrement();
			CacheQuery nextQuery = itr.next();
			dispatch(nextQuery);
		}

	}

	@Override
	public synchronized ComputeJobResultPolicy  result(ComputeJobResult res,
			List<ComputeJobResult> rcvd) throws IgniteException {

		IgniteException exception = res.getException();
		if (exception != null) {
			log.error(exception.getMessage(), exception);
			return super.result(res, rcvd);
		}

		dispatchRemainingTasks(itrRef.get(), 1);

		onJobProcessed(res.getData(), getListener());
		return count.get() == totalCount.get() ? ComputeJobResultPolicy.REDUCE
				: ComputeJobResultPolicy.WAIT;

	}

	protected synchronized void onJobProcessed(R value,
			JobProgressListener<R> listener) {
		int count = this.count.incrementAndGet();

		if (listener != null) {
			listener.onJobProgress(new JobProcessedEvent<R>(value, count));

		}
	}

	private void dispatch(CacheQuery query) {
		try {
			ComputeJob job = createComputeJob(query, cacheName, nodeLoaderClass);
			mapper.send(job, balancer.getBalancedNode(job, null));

		} catch (Exception e) {
			onException(e, getListener());
		}
	}

	protected ComputeJob createComputeJob(CacheQuery query, String cacheName,
			Class<? extends ComputeServiceApi> clzName) {
		return new AroGridJob<R>(query, cacheName, clzName.getName());
	}

	protected synchronized void onException(Throwable e,
			JobProgressListener<R> listener) {
		log.error(e.getMessage(), e);
		if (listener != null) {
			listener.onException(e);
		}

	}

	protected synchronized void onFinished(long count,
			JobProgressListener<R> listener) {
		if (listener != null) {
			listener.onJobsCompleted(count);
		}
	}

	@Override
	public Long reduce(List<ComputeJobResult> results) throws IgniteException {
		long count = (long) this.count.get();
		if (count == totalCount.get()) {
			onFinished(count, getListener());
		}

		return count;
	}

}
