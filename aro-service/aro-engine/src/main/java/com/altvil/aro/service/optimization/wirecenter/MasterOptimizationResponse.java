package com.altvil.aro.service.optimization.wirecenter;

import java.util.Collection;
import java.util.List;

public class MasterOptimizationResponse {

	private Collection<OptimizedWirecenter> updates;

	public MasterOptimizationResponse(Collection<OptimizedWirecenter> updates) {
		this.updates = updates;
	}

	public List<OptimizedWirecenter> getUpdates() {
		return updates;
	}

}
