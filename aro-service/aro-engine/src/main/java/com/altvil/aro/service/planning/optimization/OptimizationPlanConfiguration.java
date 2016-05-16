package com.altvil.aro.service.planning.optimization;

import com.altvil.aro.service.planing.OptimizationType;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;

public interface OptimizationPlanConfiguration extends FiberPlanConfiguration {
	AbstractOptimizationPlan getOptimizationPlan();

	double getCoverage();

	OptimizationType getOptimizationType();
}
