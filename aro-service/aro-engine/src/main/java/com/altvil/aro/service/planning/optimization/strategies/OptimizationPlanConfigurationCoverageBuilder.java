package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.annotation.OptimizationPlanStrategy;
import com.altvil.aro.service.planning.CoverageOptimizationPlan;
import com.altvil.aro.service.planning.NpvOptimizationPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfigurationBuilder;
import com.altvil.enumerations.FiberPlanAlgorithm;
import com.altvil.enumerations.OptimizationType;

@OptimizationPlanStrategy(type=OptimizationPlanConfigurationBuilder.class, types=OptimizationType.COVERAGE)
public class OptimizationPlanConfigurationCoverageBuilder implements OptimizationPlanConfigurationBuilder<OptimizationPlanConfigurationCoverage> {
	@Override
	public OptimizationPlanConfigurationCoverage build(OptimizationPlan fiberPlan) {
		return new OptimizationPlanConfigurationCoverage((CoverageOptimizationPlan) fiberPlan);
	}

}
