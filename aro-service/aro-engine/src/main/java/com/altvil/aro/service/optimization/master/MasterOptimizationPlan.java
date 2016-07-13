package com.altvil.aro.service.optimization.master;

import java.util.Collection;

import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

public class MasterOptimizationPlan {

	private MasterOptimizationRequest request;
	private Collection<OptimizedPlan> updates;

	public MasterOptimizationPlan(MasterOptimizationRequest request,
			Collection<OptimizedPlan> updates) {
		this.updates = updates;
		this.request = request;
	}

	public Collection<OptimizedPlan> getUpdates() {
		return updates;
	}

	public long getPlanId() {
		return request.getPlanId();
	}

	public MasterOptimizationRequest getRequest() {
		return request;
	}

}
