package com.altvil.aro.service.optimization.strategy;

import com.altvil.aro.service.optimization.strategy.comparators.OptimizationImprovement;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;

public interface OptimizationNetworkComparator {
    OptimizationImprovement calculateImprovement(OptimizedNetwork base, OptimizedNetwork compared, PrunedNetwork prunedNetwork);
}
