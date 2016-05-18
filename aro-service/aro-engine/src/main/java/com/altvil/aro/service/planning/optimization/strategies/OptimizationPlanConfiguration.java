package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.aro.service.planing.OptimizationInputs;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfiguration;

public class OptimizationPlanConfiguration extends FiberPlanConfiguration implements OptimizationPlan {
	private OptimizationInputs optimizationInputs;

	public OptimizationPlanConfiguration(OptimizationPlan fiberPlan) {
		super(fiberPlan);

		this.optimizationInputs = fiberPlan.getOptimizationInputs();
	}

	public OptimizationInputs getOptimizationInputs() {
		return optimizationInputs;
	}

	public void setOptimizationInputs(OptimizationInputs optimizationInputs) {
		this.optimizationInputs = optimizationInputs;
	}
}
