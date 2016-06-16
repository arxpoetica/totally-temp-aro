package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.annotation.OptimizationPlanStrategy;
import com.altvil.aro.service.planning.MaxIrrOptimizationPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfigurationBuilder;
import com.altvil.enumerations.OptimizationType;

@OptimizationPlanStrategy(type=OptimizationPlanConfigurationBuilder.class, types={OptimizationType.BUDGET_IRR, OptimizationType.MAX_IRR, OptimizationType.TARGET_IRR})
public class OptimizationPlanConfigurationMaxIrrBuilder implements OptimizationPlanConfigurationBuilder<OptimizationPlanConfigurationMaxIrr> {
	@Override
	public OptimizationPlanConfigurationMaxIrr build(OptimizationPlan fiberPlan) {
		switch(fiberPlan.getOptimizationType()) {
		case TARGET_IRR:
			return new OptimizationPlanConfigurationMaxIrr((MaxIrrOptimizationPlan) fiberPlan);
		default:
			return new OptimizationPlanConfigurationMaxIrr((MaxIrrOptimizationPlan) fiberPlan);
		}
	}

}
