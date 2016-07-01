package com.altvil.aro.service.optimization.wirecenter;

import java.util.Collection;

import com.altvil.aro.service.optimize.OptimizedNetwork;

public interface PrunedNetwork {

	long getPlanId() ;
	boolean isEmpty() ;
	Collection<OptimizedNetwork> getOptimizedNetworks();

}
