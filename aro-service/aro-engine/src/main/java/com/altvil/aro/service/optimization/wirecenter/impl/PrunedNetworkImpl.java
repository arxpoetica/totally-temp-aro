package com.altvil.aro.service.optimization.wirecenter.impl;

import java.util.Collection;

import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;

public class PrunedNetworkImpl implements PrunedNetwork {

	private Collection<OptimizedNetwork> optimizedNetworks;
	private long planId;

	public PrunedNetworkImpl(long planId,
			Collection<OptimizedNetwork> optimizedNetworks) {
		super();
		this.optimizedNetworks = optimizedNetworks;
		this.planId = planId;
	}

	@Override
	public long getPlanId() {
		return planId;
	}

	@Override
	public Collection<OptimizedNetwork> getOptimizedNetworks() {
		return optimizedNetworks;
	}

}
