package com.altvil.aro.service.optimization.wirecenter;

import java.util.Collection;

import com.altvil.aro.service.plan.CompositeNetworkModel;

public interface PlannedNetwork {

	long getPlanId() ;
	
	Collection<NetworkDemand> getNetworkDemands() ; ;
	
	CompositeNetworkModel getPlannedNetwork() ;
}
