package com.altvil.aro.service.planning;

import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.FiberPlanAlgorithm;

public interface FiberPlan {
	long getPlanId();

	int getYear();

	FiberPlanAlgorithm getAlgorithm();
	FiberNetworkConstraints getFiberNetworkConstraints();
}
