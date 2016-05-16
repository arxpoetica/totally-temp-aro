package com.altvil.aro.service.planning.optimization;

import com.altvil.aro.service.planing.OptimizationInputs;
import com.altvil.aro.service.planning.optimization.impl.AbstractOptimizationPlan;

@Deprecated
public interface OptimizationNetworkConstraintsBuilder {
	OptimizationInputs build(AbstractOptimizationPlan fiberPlan);
}
