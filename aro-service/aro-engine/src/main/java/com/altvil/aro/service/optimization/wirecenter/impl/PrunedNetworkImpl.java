package com.altvil.aro.service.optimization.wirecenter.impl;

import java.util.Collection;

import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;

public class PrunedNetworkImpl implements PrunedNetwork {

	private Collection<OptimizedNetwork> optimizedNetworks;
	private long planId;
	private CompetitiveDemandMapping competitiveDemandMapping;

	public PrunedNetworkImpl(long planId,
			Collection<OptimizedNetwork> optimizedNetworks,
			CompetitiveDemandMapping competitiveDemandMapping) {
		super();
		this.optimizedNetworks = optimizedNetworks;
		this.planId = planId;
		this.competitiveDemandMapping = competitiveDemandMapping;
	}

	@Override
	public CompetitiveDemandMapping getCompetitiveDemandMapping() {
		return competitiveDemandMapping;
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
