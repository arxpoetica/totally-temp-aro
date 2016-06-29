package com.altvil.aro.service.optimization.spi.impl;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.optimization.spi.OptimizationExecutor;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService;

@Service
public class OptimizationExecutorServiceImpl implements
		OptimizationExecutorService {

	@Override
	public OptimizationExecutor createOptimizationExecutor(ExecutorType type) {
		return new OptimizationExecutorImpl(toThreadCount(type));
	}

	private int toThreadCount(ExecutorType type) {
		switch (type) {
		case Wirecenter:
			return 10;
		case MasterPlan:
			return 5;
		default:
			return 5;
		}
	}

}
