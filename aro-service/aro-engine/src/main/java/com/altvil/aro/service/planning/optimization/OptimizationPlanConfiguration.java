package com.altvil.aro.service.planning.optimization;

import com.altvil.aro.service.planing.OptimizationType;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;
import com.altvil.aro.service.planning.optimization.impl.AbstractOptimizationPlan;

public interface OptimizationPlanConfiguration<FP extends OptimizationPlan> extends FiberPlanConfiguration<FP> {
	FP getOptimizationPlan();

	double getCoverage();

	OptimizationType getOptimizationType();
}
