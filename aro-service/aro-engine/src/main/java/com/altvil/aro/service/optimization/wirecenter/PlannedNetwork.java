package com.altvil.aro.service.optimization.wirecenter;

import com.altvil.aro.service.plan.CompositeNetworkModel;

public interface PlannedNetwork {

	long getPlanId() ;
	CompositeNetworkModel getPlannedNetwork() ;
}
