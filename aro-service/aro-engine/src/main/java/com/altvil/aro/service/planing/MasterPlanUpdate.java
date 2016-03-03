package com.altvil.aro.service.planing;

import java.util.List;

public class MasterPlanUpdate {

	private List<WirecenterNetworkPlan> updates;

	public MasterPlanUpdate(List<WirecenterNetworkPlan> updates) {
		super();
		this.updates = updates;
	}

	public List<WirecenterNetworkPlan> getUpdates() {
		return updates;
	}

}
