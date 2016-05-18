package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.annotation.FiberPlanStrategy;
import com.altvil.aro.service.planning.NpvOptimizationPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfigurationBuilder;
import com.altvil.enumerations.FiberPlanAlgorithm;

@FiberPlanStrategy(type=OptimizationPlanConfigurationBuilder.class, algorithms=FiberPlanAlgorithm.NPV)
public class OptimizationPlanConfigurationNpvBuilder implements OptimizationPlanConfigurationBuilder<OptimizationPlanConfigurationNpv> {
	@Override
	public OptimizationPlanConfigurationNpv build(OptimizationPlan fiberPlan) {
		return new OptimizationPlanConfigurationNpv((NpvOptimizationPlan) fiberPlan);
	}

}
