package com.altvil.aro.service.optimization.wirecenter.impl;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.plan.CompositeNetworkModel;

public class DefaultPlannedNetwork implements PlannedNetwork {

	private long planId;
	private CompositeNetworkModel plannedNetwork;
	private LocationDemand globalDemand;

	public DefaultPlannedNetwork(long planId,
			CompositeNetworkModel plannedNetwork,
			LocationDemand globalDemand) {
		super();
		this.planId = planId;
		this.plannedNetwork = plannedNetwork;
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
	public CompositeNetworkModel getPlannedNetwork() {
		return plannedNetwork;
	}

}
