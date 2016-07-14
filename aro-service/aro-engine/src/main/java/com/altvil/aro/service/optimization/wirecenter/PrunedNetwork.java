package com.altvil.aro.service.optimization.wirecenter;

import java.util.Collection;
import java.util.List;

import com.altvil.aro.service.optimize.OptimizedNetwork;

public interface PrunedNetwork {

	Collection<NetworkDemand> getNetworkDemands() ;
	
	long getPlanId() ;
	
	boolean isEmpty() ;

	Collection<OptimizedNetwork> getOptimizedNetworks();

}
