package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.annotation.FiberPlanDefaultStrategy;
import com.altvil.aro.service.planning.optimization.impl.AbstractOptimizationPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfiguration;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfigurationBuilder;

@FiberPlanDefaultStrategy(type=OptimizationPlanConfigurationBuilder.class)
public class OptimizationPlanConfigurationDefaultBuilder implements OptimizationPlanConfigurationBuilder<OptimizationPlan> {
	@Override
	public OptimizationPlanConfiguration<OptimizationPlan> build(OptimizationPlan fiberPlan) {
		return new OptimizationPlanDefaultConfiguration(fiberPlan);
	}

}
