package com.altvil.aro.service.cu.execute.impl;

import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.ignite.IgniteException;
import org.apache.ignite.compute.ComputeJob;
import org.apache.ignite.compute.ComputeJobResult;
import org.apache.ignite.compute.ComputeJobSibling;
import org.apache.ignite.compute.ComputeTaskSession;
import org.apache.ignite.compute.ComputeTaskSessionFullSupport;
import org.apache.ignite.compute.ComputeTaskSplitAdapter;
import org.apache.ignite.resources.TaskSessionResource;

import com.altvil.aro.service.cu.ComputeServiceApi;
import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.execute.Priority;

@SuppressWarnings("serial")
@ComputeTaskSessionFullSupport
public class PrioritySplitter<R extends Serializable> extends
		ComputeTaskSplitAdapter<Collection<CacheQuery>, List<R>> {

	private Class<? extends ComputeServiceApi> nodeLoaderClass;
	private String cacheName;
	private Priority priority;

	@TaskSessionResource
	private transient ComputeTaskSession taskSes;

	public PrioritySplitter(String cacheName, Priority priority,
			Class<? extends ComputeServiceApi> nodeLoaderClass) {
		super();
		this.cacheName = cacheName;
		this.priority = priority;
		this.nodeLoaderClass = nodeLoaderClass;
	}

	public void cancel() {
		for (ComputeJobSibling s : taskSes.getJobSiblings()) {
			s.cancel();
		}
	}

	@SuppressWarnings({ "unchecked", "rawtypes" })
	@Override
	public List<R> reduce(List<ComputeJobResult> results)
			throws IgniteException {
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
