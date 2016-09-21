package com.altvil.aro.service.cu.execute.impl;

import java.io.Serializable;
import java.util.ArrayList;
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
public class RobustBatchGridJob<R extends Serializable> extends
		ComputeTaskSplitAdapter<Collection<CacheQuery>, List<R>> {

	private Class<? extends ComputeServiceApi> nodeLoaderClass;
	private String cacheName;
	private Priority priority;

	@TaskSessionResource
	private transient ComputeTaskSession taskSes;

	public RobustBatchGridJob(String cacheName, Priority priority,
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

	@Override
	public List<R> reduce(List<ComputeJobResult> results)
			throws IgniteException {

		List<R> result = new ArrayList<R>();
		StringBuffer sb = new StringBuffer();
		int errorCount = 0;
		for (ComputeJobResult r : results) {
			AroGridResult<R> gr = r.getData();
			if (gr.isValid()) {
				result.add(gr.getValue());
			} else {
				sb.append("Failed to process compute unit " + gr.getCacheName()
						+ "/" + gr.getCacheQuery() + " caused by  : "
						+ gr.getExceptionMessage());
				errorCount++;
			}
		}

		if (errorCount > 0) {
			throw new RuntimeException("Failed to process Batch :"
					+ sb.toString());
		}

		return result;
	}

	@Override
	protected Collection<? extends ComputeJob> split(int gridSize,
			Collection<CacheQuery> inputs) throws IgniteException {

		taskSes.setAttribute("grid.task.priority", priority.ordinal() * 10);

		return inputs
				.stream()
				.map(q -> new RobustBsaGridJob<>(q, cacheName, nodeLoaderClass
						.getName())).collect(Collectors.toList());
	}
}
