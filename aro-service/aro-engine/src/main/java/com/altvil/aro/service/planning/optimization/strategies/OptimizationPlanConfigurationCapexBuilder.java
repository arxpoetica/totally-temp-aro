package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.annotation.OptimizationPlanStrategy;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfigurationBuilder;
import com.altvil.enumerations.OptimizationType;

@OptimizationPlanStrategy(type=OptimizationPlanConfigurationBuilder.class, types=OptimizationType.CAPEX)
public class OptimizationPlanConfigurationCapexBuilder implements OptimizationPlanConfigurationBuilder<OptimizationPlanConfigurationCapex> {
	@Override
	public OptimizationPlanConfigurationCapex build(OptimizationPlan fiberPlan) {
		return new OptimizationPlanConfigurationCapex((OptimizationPlan) fiberPlan);
	}

}
