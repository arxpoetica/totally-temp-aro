package com.altvil.aro.service.optimization.wirecenter;

import java.util.Collection;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.optimize.OptimizedNetwork;

public interface PrunedNetwork {

	LocationDemand getGlobalDemand() ;
	long getPlanId() ;
	
	boolean isEmpty() ;
	Collection<OptimizedNetwork> getOptimizedNetworks();

}
