package com.altvil.aro.service.cu.execute.impl;

import java.io.Serializable;

import org.apache.ignite.compute.ComputeJob;

import com.altvil.aro.service.cu.ComputeServiceApi;
import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.execute.JobProgressListener;
import com.altvil.aro.service.cu.execute.Priority;

public class RobustStreamingJobProcess<R extends Serializable> extends
		StreamingJobProcess<AroGridResult<R>> {

	private static final long serialVersionUID = 1L;

	public RobustStreamingJobProcess(
			Class<? extends ComputeServiceApi> nodeLoaderClass, String cacheName,
			Priority priority,
			JobProgressListener<AroGridResult<R>> progressListener) {
		super(nodeLoaderClass, cacheName, priority, progressListener);
	}

	@Override
	protected ComputeJob createComputeJob(CacheQuery query, String cacheName,
			Class<? extends ComputeServiceApi> clzName) {
		return new RobustBsaGridJob<R>(query, cacheName, clzName.getName());
	}

}
