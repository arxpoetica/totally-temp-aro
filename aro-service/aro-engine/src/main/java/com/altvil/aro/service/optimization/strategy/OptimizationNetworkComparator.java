package com.altvil.aro.service.optimization.strategy;

import com.altvil.aro.service.optimization.strategy.comparators.OptimizationImprovement;
import com.altvil.aro.service.optimization.strategy.impl.SingleAreaAnalysis;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;

public interface OptimizationNetworkComparator {
    OptimizationImprovement calculateImprovement(PlanAnalysis base, PlanAnalysis compared, SingleAreaAnalysis prunedNetwork);
}
