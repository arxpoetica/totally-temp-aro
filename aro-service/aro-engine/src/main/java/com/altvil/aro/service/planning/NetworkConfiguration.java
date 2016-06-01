package com.altvil.aro.service.planning;

public interface NetworkConfiguration {
	long getPlanId();

	boolean isFilteringRoadLocationsBySelection();

	boolean isFilteringRoadLocationDemandsBySelection();

	int getYear();
	
	public <T> T dependentPlan(long dependentId);
}
