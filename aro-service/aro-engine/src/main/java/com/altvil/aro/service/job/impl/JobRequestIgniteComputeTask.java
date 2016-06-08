package com.altvil.aro.service.job.impl;

import java.security.Principal;
import java.util.concurrent.Callable;

import org.apache.ignite.IgniteCompute;
import org.apache.ignite.compute.ComputeTask;
import org.jetbrains.annotations.Nullable;

import com.altvil.aro.service.job.JobService.JobRequest;

public class JobRequestIgniteComputeTask<T, R> extends JobRequest<R> {
	
	public JobRequestIgniteComputeTask(Principal creator, IgniteCompute grid, ComputeTask<T, R> task, @Nullable T taskMapArg) {
		super(creator, new Callable<R>() {
			@SuppressWarnings("unchecked")
			@Override
			public R call() throws Exception {
				grid.execute(task, taskMapArg);
				return (R) grid.future().get();
			}
		});
	}

}
