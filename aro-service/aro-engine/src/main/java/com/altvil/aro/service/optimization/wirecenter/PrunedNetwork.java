package com.altvil.aro.service.optimization.wirecenter;

import java.util.Collection;

import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.optimize.OptimizedNetwork;

public interface PrunedNetwork {

	CompetitiveDemandMapping getCompetitiveDemandMapping() ;
	
	long getPlanId() ;
	
	boolean isEmpty() ;

	Collection<OptimizedNetwork> getOptimizedNetworks();

}
