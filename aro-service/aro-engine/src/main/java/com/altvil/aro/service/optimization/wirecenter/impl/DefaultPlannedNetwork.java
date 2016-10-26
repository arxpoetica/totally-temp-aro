package com.altvil.aro.service.optimization.wirecenter.impl;

import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.generated.GeneratedData;
import com.altvil.aro.service.optimization.wirecenter.generated.GeneratedNetworkData;
import com.altvil.aro.service.plan.CompositeNetworkModel;

public class DefaultPlannedNetwork implements PlannedNetwork {

	private long planId;
	private CompositeNetworkModel plannedNetwork;
	private CompetitiveDemandMapping competitiveDemandMapping;
	private GeneratedData generatedData;

	public DefaultPlannedNetwork(long planId,
			CompositeNetworkModel plannedNetwork,
			CompetitiveDemandMapping competitiveDemandMapping,
			GeneratedData generatedData) {
		super();
		this.planId = planId;
		this.plannedNetwork = plannedNetwork;
		this.competitiveDemandMapping = competitiveDemandMapping;
		this.generatedData = generatedData;
	}

	public DefaultPlannedNetwork(long planId,
			CompositeNetworkModel plannedNetwork,
			CompetitiveDemandMapping competitiveDemandMapping) {
		this(planId, plannedNetwork, competitiveDemandMapping, null);
	}

	public DefaultPlannedNetwork(PlannedNetwork network,
			GeneratedData generatedData) {
		this(network.getPlanId(), network.getPlannedNetwork(), network
				.getCompetitiveDemandMapping(), generatedData);
	}

	@Override
	public GeneratedData getGeneratedData() {
		return generatedData;
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
