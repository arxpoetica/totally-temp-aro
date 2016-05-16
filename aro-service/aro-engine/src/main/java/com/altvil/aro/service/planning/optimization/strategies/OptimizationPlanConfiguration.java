package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.aro.service.planing.OptimizationType;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfiguration;

public class OptimizationPlanConfiguration extends FiberPlanConfiguration implements OptimizationPlan {
	private final double coverage;
	
	private final OptimizationType optimizationType;
	public OptimizationPlanConfiguration(OptimizationPlan fiberPlan) {
		super(fiberPlan);
		
		this.coverage = fiberPlan.getCoverage();
		this.optimizationType = fiberPlan.getOptimizationType();
	}
	
	@Override
	public double getCoverage() {
		return coverage;
	}

	@Override
	public OptimizationType getOptimizationType() {
		return optimizationType;
	}
}