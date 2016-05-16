package com.altvil.aro.service.planning.optimization;

import com.altvil.aro.service.planing.OptimizationInputs;

@Deprecated
public interface OptimizationNetworkConstraintsBuilder {
	OptimizationInputs build(AbstractOptimizationPlan fiberPlan);
}
