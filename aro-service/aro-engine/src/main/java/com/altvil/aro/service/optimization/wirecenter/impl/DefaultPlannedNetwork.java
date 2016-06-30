package com.altvil.aro.service.optimization.wirecenter.impl;

import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.plan.CompositeNetworkModel;

public class DefaultPlannedNetwork implements PlannedNetwork {

	private long planId ;
	private CompositeNetworkModel plannedNetwork;

	public DefaultPlannedNetwork(long planId, CompositeNetworkModel plannedNetwork) {
		super();
		this.planId = planId ;
		this.plannedNetwork = plannedNetwork;
	}
	
	

	@Override
	public long getPlanId() {
		return planId ;
	}

	@Override
	public CompositeNetworkModel getPlannedNetwork() {
		return plannedNetwork;
	}

}
