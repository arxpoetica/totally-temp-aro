package com.altvil.aro.service.optimization.spi.impl;

import java.util.Collection;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import com.altvil.aro.service.optimization.spi.ComputeUnitCallable;
import com.altvil.aro.service.optimization.spi.OptimizationExecutor;
import com.altvil.utils.StreamUtil;

public class OptimizationExecutorImpl implements OptimizationExecutor {

	private ExecutorService executorService;
	
	public OptimizationExecutorImpl(int threadCount) {
		executorService =  Executors.newFixedThreadPool(threadCount) ;
	}

	@Override
	public <V> Future<V> submit(ComputeUnitCallable<V> cu) {
		return executorService.submit(wrap(cu)) ;
	}
	
	private <V> Callable<V> wrap(ComputeUnitCallable<V> cu) {
		return () -> cu.call() ;
	}

	@Override
	public <V> List<Future<V>> invokeAll(
			Collection<ComputeUnitCallable<V>> tasks) {
		try {
			return executorService.invokeAll(StreamUtil.map(tasks, this::wrap));
		} catch (InterruptedException e) {
			throw new RuntimeException(e.getMessage(), e) ;
		}
	}

}
