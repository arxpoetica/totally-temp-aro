package com.altvil.aro.service.optimization.wirecenter;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.plan.CompositeNetworkModel;

public interface PlannedNetwork {

	LocationDemand getGlobalDemand() ;
	long getPlanId() ;
	
	CompositeNetworkModel getPlannedNetwork() ;
}
