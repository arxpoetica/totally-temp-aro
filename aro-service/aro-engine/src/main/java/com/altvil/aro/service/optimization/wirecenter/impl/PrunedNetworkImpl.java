package com.altvil.aro.service.optimization.wirecenter.impl;

import java.util.Collection;

import com.altvil.aro.service.optimization.wirecenter.NetworkDemand;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;

public class PrunedNetworkImpl implements PrunedNetwork {

	private Collection<OptimizedNetwork> optimizedNetworks;
	private long planId;
	private Collection<NetworkDemand> networkDemands;

	public PrunedNetworkImpl(long planId,
			Collection<OptimizedNetwork> optimizedNetworks,
			Collection<NetworkDemand> networkDemands) {
		super();
		this.optimizedNetworks = optimizedNetworks;
		this.planId = planId;
		this.networkDemands = networkDemands;
	}

	@Override
	public Collection<NetworkDemand> getNetworkDemands() {
		return networkDemands;
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
