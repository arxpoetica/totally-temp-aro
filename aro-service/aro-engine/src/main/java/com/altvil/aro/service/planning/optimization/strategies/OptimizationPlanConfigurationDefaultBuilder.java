package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.annotation.FiberPlanDefaultStrategy;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfigurationBuilder;

@FiberPlanDefaultStrategy(type=OptimizationPlanConfigurationBuilder.class)
public class OptimizationPlanConfigurationDefaultBuilder implements OptimizationPlanConfigurationBuilder<OptimizationPlanConfiguration> {
	@Override
	public OptimizationPlanConfiguration build(OptimizationPlan optimizationPlan) {
		return new OptimizationPlanConfiguration(optimizationPlan);
	}

}
