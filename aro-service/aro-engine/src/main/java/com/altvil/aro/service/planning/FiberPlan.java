package com.altvil.aro.service.planning;

import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.FiberPlanAlgorithm;

public interface FiberPlan {
	long getPlanId();

	int getYear();

	FiberPlanAlgorithm getAlgorithm();
	Set<LocationEntityType> getLocationEntityTypes();
	FiberNetworkConstraints getFiberNetworkConstraints();
}
