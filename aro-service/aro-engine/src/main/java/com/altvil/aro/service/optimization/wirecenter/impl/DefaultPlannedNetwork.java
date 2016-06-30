package com.altvil.aro.service.optimization.wirecenter.impl;

import java.util.Optional;

import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.plan.CompositeNetworkModel;

public class DefaultPlannedNetwork implements PlannedNetwork {

	private Optional<CompositeNetworkModel> plannedNetwork;

	public DefaultPlannedNetwork(Optional<CompositeNetworkModel> plannedNetwork) {
		super();
		this.plannedNetwork = plannedNetwork;
	}

	@Override
	public Optional<CompositeNetworkModel> getPlannedNetwork() {
		return plannedNetwork;
	}

}
