package com.altvil.aro.service.planning;

import com.altvil.aro.service.planing.OptimizationType;

public interface OptimizationPlan extends FiberPlan {
	public OptimizationType getOptimizationType();

	public double getCoverage();
}
