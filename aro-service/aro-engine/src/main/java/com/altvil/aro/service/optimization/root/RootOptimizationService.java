package com.altvil.aro.service.optimization.root;

import com.altvil.aro.service.optimization.wirecenter.RootOptimizationRequest;

public interface RootOptimizationService {
	OptimizedRootPlan optimize(RootOptimizationRequest request);
}
