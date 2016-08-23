package com.altvil.aro.service.optimization.root;

import java.util.concurrent.Future;

import com.altvil.aro.service.optimization.wirecenter.RootOptimizationRequest;

public interface RootOptimizationService {
	Future<OptimizedRootPlan> optimize(RootOptimizationRequest request);
}
