package com.altvil.aro.service.optimization.wirecenter.impl;

import java.util.Collection;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;

public class PrunedNetworkImpl implements PrunedNetwork {

	private Collection<OptimizedNetwork> optimizedNetworks;
	private long planId;
	private LocationDemand globalDemand ;

	public PrunedNetworkImpl(long planId,
			Collection<OptimizedNetwork> optimizedNetworks,
			LocationDemand globalDemand) {
		super();
		this.optimizedNetworks = optimizedNetworks;
		this.planId = planId;
		this.globalDemand = globalDemand ;
	}
	
	

	@Override
	public LocationDemand getGlobalDemand() {
		return globalDemand;
	}



	@Override
	public long getPlanId() {
		return planId;
	}

	@Override
	public boolean isEmpty() {
		return optimizedNetworks.isEmpty();
	}

	@Override
	public Collection<OptimizedNetwork> getOptimizedNetworks() {
		return optimizedNetworks;
	}

}
