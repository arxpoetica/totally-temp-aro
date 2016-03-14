package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.optimize.NetworkPlanner;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.spi.NetworkConstrainer;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public class DefaultNetworkPlannerImpl implements
		NetworkPlanner {

	private NetworkConstrainer constrainer;
	private List<OptimizedNetwork> optimizedNetworks = null;

	private DefaultNetworkPlannerImpl(NetworkConstrainer constrainer) {
		super();
		this.constrainer = constrainer;
	}

	public static NetworkPlanner create(NetworkConstrainer constrainer) {
		return new DefaultNetworkPlannerImpl(constrainer);
	}

	private List<OptimizedNetwork> _getOptimizedNetworks() {
		if (optimizedNetworks == null) {
			optimizedNetworks = constrainer.constrainNetwork();
		}
		return optimizedNetworks;
	}

	@Override
	public Optional<OptimizedNetwork> getNetworkPlan() {
		List<OptimizedNetwork> networks = _getOptimizedNetworks();
		return networks.size() == 0 ? Optional.empty() : Optional.of(networks.get(networks.size() - 1));
	}

	@Override
	public Collection<OptimizedNetwork> getOptimizedPlans() {
		return _getOptimizedNetworks();
	}

}