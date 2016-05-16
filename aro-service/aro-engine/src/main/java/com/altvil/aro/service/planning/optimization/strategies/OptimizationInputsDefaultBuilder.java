package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.annotation.FiberPlanDefaultStrategy;
import com.altvil.aro.service.planing.OptimizationInputs;
import com.altvil.aro.service.planing.OptimizationType;
import com.altvil.aro.service.planning.optimization.AbstractOptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationNetworkConstraintsBuilder;

@FiberPlanDefaultStrategy(type=OptimizationNetworkConstraintsBuilder.class)
public class OptimizationInputsDefaultBuilder implements OptimizationNetworkConstraintsBuilder {

	@Override
	public OptimizationInputs build(AbstractOptimizationPlan fiberPlan) {
		return new OptimizationInputs(OptimizationType.COVERAGE, 0.5);
	}
	
}
