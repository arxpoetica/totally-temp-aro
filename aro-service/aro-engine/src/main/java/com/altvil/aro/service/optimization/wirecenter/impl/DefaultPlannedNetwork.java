package com.altvil.aro.service.optimization.wirecenter.impl;

import java.util.Collection;

import com.altvil.aro.service.optimization.wirecenter.NetworkDemand;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.plan.CompositeNetworkModel;

public class DefaultPlannedNetwork implements PlannedNetwork {

	private long planId;
	private CompositeNetworkModel plannedNetwork;
	private Collection<NetworkDemand> demands;

	public DefaultPlannedNetwork(long planId,
			CompositeNetworkModel plannedNetwork,
			Collection<NetworkDemand> demands) {
		super();
		this.planId = planId;
		this.plannedNetwork = plannedNetwork;
		this.demands = demands;
	}

	@Override
	public Collection<NetworkDemand> getNetworkDemands() {
		return demands;
	}

	@Override
	public long getPlanId() {
		return planId;
	}

	@Override
	public CompositeNetworkModel getPlannedNetwork() {
		return plannedNetwork;
	}

}
