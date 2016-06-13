package com.altvil.aro.service.planning;

import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;

public interface NetworkConfiguration {
	long getPlanId();

	boolean isFilteringRoadLocationsBySelection();

	boolean isFilteringRoadLocationDemandsBySelection();

	int getYear();

	<T> T dependentPlan(long dependentId);

	Set<LocationEntityType> getLocationEntityTypes();

}
