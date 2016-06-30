package com.altvil.aro.service.optimization.wirecenter;

import java.util.Collection;

import com.altvil.aro.service.optimize.OptimizedNetwork;

public interface PrunedNetwork {

	long getPlanId() ;
	Collection<OptimizedNetwork> getOptimizedNetworks();

}
