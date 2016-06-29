package com.altvil.aro.service.optimization.wirecenter;

import java.util.Collection;

import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimize.OptimizedNetwork;

public interface PrunedNetwork {
	
	OptimizationException getOpitmizationException() ;
	WirecenterOptimizationRequest getOptimizationRequest() ;
	Collection<OptimizedNetwork> getOptimizedNetworks() ;
	
	long getPlanId() ;
	

}
