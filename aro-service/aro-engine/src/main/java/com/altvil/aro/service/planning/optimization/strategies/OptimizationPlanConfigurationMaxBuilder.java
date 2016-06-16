package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.annotation.OptimizationPlanStrategy;
import com.altvil.aro.service.planning.IrrOptimizationPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfigurationBuilder;
import com.altvil.enumerations.OptimizationType;

@OptimizationPlanStrategy(type=OptimizationPlanConfigurationBuilder.class, types={OptimizationType.BUDGET_IRR, OptimizationType.MAX_IRR, OptimizationType.TARGET_IRR})
public class OptimizationPlanConfigurationMaxBuilder implements OptimizationPlanConfigurationBuilder<OptimizationPlanConfigurationIrr> {
	@Override
	public OptimizationPlanConfigurationIrr build(OptimizationPlan fiberPlan) {
		switch(fiberPlan.getOptimizationType()) {
		case BUDGET_IRR:
			return new OptimizationPlanConfigurationBudgetIrr((IrrOptimizationPlan) fiberPlan);
		case TARGET_IRR:
			return new OptimizationPlanConfigurationTargetIrr((IrrOptimizationPlan) fiberPlan);
		default:
			return new OptimizationPlanConfigurationIrr((IrrOptimizationPlan) fiberPlan);
		}
	}

}
