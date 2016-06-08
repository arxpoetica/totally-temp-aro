package com.altvil.aro.service.planning;

import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;

public interface Plan {
	long getPlanId();
	Set<LocationEntityType> getLocationEntityTypes() ;
	<T> T dependentPlan(long dependentId);
}
