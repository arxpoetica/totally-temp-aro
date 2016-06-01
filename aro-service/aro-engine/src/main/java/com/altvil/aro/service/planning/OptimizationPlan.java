package com.altvil.aro.service.planning;

import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.OptimizationType;

public interface OptimizationPlan extends Plan {
	int getYear();
	OptimizationType getOptimizationType();
	FiberNetworkConstraints getFiberNetworkConstraints();
}
