package com.altvil.aro.service.optimization.strategy;

import com.altvil.aro.service.optimization.strategy.comparators.OptimizationImprovement;
import com.altvil.aro.service.optimization.strategy.impl.SingleAreaAnalysis;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;

public interface OptimizationNetworkComparator {
    OptimizationImprovement calculateImprovement(PlanAnalysis base, PlanAnalysis compared, SingleAreaAnalysis prunedNetwork);
}
