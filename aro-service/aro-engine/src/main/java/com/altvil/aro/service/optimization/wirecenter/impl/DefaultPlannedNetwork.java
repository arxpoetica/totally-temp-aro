package com.altvil.aro.service.optimization.wirecenter.impl;

import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.plan.CompositeNetworkModel;

public class DefaultPlannedNetwork implements PlannedNetwork {

	private long planId;
	private CompositeNetworkModel plannedNetwork;
	private CompetitiveDemandMapping competitiveDemandMapping;

	public DefaultPlannedNetwork(long planId,
			CompositeNetworkModel plannedNetwork,
			CompetitiveDemandMapping competitiveDemandMapping) {
		super();
		this.planId = planId;
		this.plannedNetwork = plannedNetwork;
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
	public CompositeNetworkModel getPlannedNetwork() {
		return plannedNetwork;
	}

}
