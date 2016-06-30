package com.altvil.aro.service.optimization.wirecenter;

import java.util.Collection;

import com.altvil.aro.service.planing.WirecenterNetworkPlan;

public class MasterOptimizationResponse {

	private Collection<WirecenterNetworkPlan> updates;

	public MasterOptimizationResponse(Collection<WirecenterNetworkPlan> updates) {
		this.updates = updates;
	}

	public Collection<WirecenterNetworkPlan> getUpdates() {
		return updates;
	}

}
