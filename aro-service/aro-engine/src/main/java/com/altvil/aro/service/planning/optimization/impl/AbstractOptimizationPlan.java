package com.altvil.aro.service.planning.optimization.impl;

import com.altvil.aro.service.planing.OptimizationInputs;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;
import com.altvil.enumerations.FiberPlanAlgorithm;

public abstract class AbstractOptimizationPlan extends AbstractFiberPlan implements FiberPlan, OptimizationPlan {
	private OptimizationInputs optimizationInputs;
	
	protected AbstractOptimizationPlan(FiberPlanAlgorithm algorithm) {
		super(algorithm);
	}

	public OptimizationInputs getOptimizationInputs() {
		return optimizationInputs;
	}

	public void setOptimizationInputs(OptimizationInputs optimizationInputs) {
		this.optimizationInputs = optimizationInputs;
	}
}
