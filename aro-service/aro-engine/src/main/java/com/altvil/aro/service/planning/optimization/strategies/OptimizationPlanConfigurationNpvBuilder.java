package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.annotation.OptimizationPlanStrategy;
import com.altvil.aro.service.planning.NpvOptimizationPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfigurationBuilder;
import com.altvil.enumerations.OptimizationType;

@OptimizationPlanStrategy(type=OptimizationPlanConfigurationBuilder.class, types=OptimizationType.NPV)
public class OptimizationPlanConfigurationNpvBuilder implements OptimizationPlanConfigurationBuilder<OptimizationPlanConfigurationNpv> {
	@Override
	public OptimizationPlanConfigurationNpv build(OptimizationPlan fiberPlan) {
		return new OptimizationPlanConfigurationNpv((NpvOptimizationPlan) fiberPlan);
	}

}
