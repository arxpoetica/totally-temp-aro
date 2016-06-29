package com.altvil.aro.service.optimization.wirecenter;

import java.util.List;

import com.altvil.aro.service.planing.WirecenterNetworkPlan;

public class MasterOptimizationResponse {

	private List<WirecenterNetworkPlan> updates;

	public MasterOptimizationResponse(List<WirecenterNetworkPlan> updates) {
		this.updates = updates;
	}

	public List<WirecenterNetworkPlan> getUpdates() {
		return updates;
	}

}
