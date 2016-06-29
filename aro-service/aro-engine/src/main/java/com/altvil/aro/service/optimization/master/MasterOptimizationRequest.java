package com.altvil.aro.service.optimization.master;

import java.util.Collection;

import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.optimization.OptimizationRequest;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.plan.FiberNetworkConstraints;

public class MasterOptimizationRequest extends OptimizationRequest {

	private Collection<Integer> wireCenters;

	public MasterOptimizationRequest(
			OptimizationConstraints optimizationConstraints,
			FiberNetworkConstraints constraints, NetworkDataRequest request,
			Collection<Integer> wireCenters) {
		super(optimizationConstraints, constraints, request);
		this.wireCenters = wireCenters;
	}

	public Collection<Integer> getWireCenters() {
		return wireCenters;
	}

}
