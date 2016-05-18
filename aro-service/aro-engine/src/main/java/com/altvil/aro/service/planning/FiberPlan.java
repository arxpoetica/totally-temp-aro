package com.altvil.aro.service.planning;

import com.altvil.enumerations.FiberPlanAlgorithm;

public interface FiberPlan {
	long getPlanId();

	int getYear();

	FiberPlanAlgorithm getAlgorithm();

}
