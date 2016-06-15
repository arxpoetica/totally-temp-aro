package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.annotation.OptimizationPlanStrategy;
import com.altvil.aro.service.planning.MaxIrrOptimizationPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfigurationBuilder;
import com.altvil.enumerations.OptimizationType;

@OptimizationPlanStrategy(type=OptimizationPlanConfigurationBuilder.class, types={OptimizationType.BUDGET_IRR, OptimizationType.MAX_IRR})
public class OptimizationPlanConfigurationMaxIrrBuilder implements OptimizationPlanConfigurationBuilder<OptimizationPlanConfigurationMaxIrr> {
	@Override
	public OptimizationPlanConfigurationMaxIrr build(OptimizationPlan fiberPlan) {
		return new OptimizationPlanConfigurationMaxIrr((MaxIrrOptimizationPlan) fiberPlan);
	}

}
