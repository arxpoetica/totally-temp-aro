package com.altvil.aro.service.planning;

import java.util.Set;

import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.OptimizationType;

public interface OptimizationPlan extends Plan {
	int getYear();
	OptimizationType getOptimizationType();
	FiberNetworkConstraints getFiberNetworkConstraints();
	Set<Integer> getSelectedWireCenters() ;
}
