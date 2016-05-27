package com.altvil.aro.service.planning;

import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.enumerations.OptimizationType;

public interface OptimizationPlan extends Plan {
	int getYear();
	OptimizationType getOptimizationType();
}
