package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.aro.service.planing.OptimizationType;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanDefaultConfiguration;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfiguration;

public class OptimizationPlanDefaultConfiguration extends FiberPlanDefaultConfiguration<OptimizationPlan> implements OptimizationPlanConfiguration<OptimizationPlan> {
	private final OptimizationPlan fiberPlan;
	
	public OptimizationPlanDefaultConfiguration(OptimizationPlan fiberPlan) {
		super(fiberPlan);
		this.fiberPlan = fiberPlan;
	}

	
	@Override
	public OptimizationPlan getOptimizationPlan() {
		return fiberPlan;
	}
	
	@Override
	public OptimizationType getOptimizationType() {
		return OptimizationType.COVERAGE;
	}

	@Override
	public double getCoverage() {
		return 0.5;
	}
}