package com.altvil.aro.service.optimization;

import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.plan.FiberNetworkConstraints;

public class OptimizationRequest {

	protected OptimizationConstraints optimizationConstraints;
	protected FiberNetworkConstraints constraints;
	protected NetworkDataRequest networkDataRequest;
	
	public OptimizationRequest(OptimizationConstraints optimizationConstraints,
			FiberNetworkConstraints constraints,
			NetworkDataRequest networkDataRequest) {
		super();
		this.optimizationConstraints = optimizationConstraints;
		this.constraints = constraints;
		this.networkDataRequest = networkDataRequest;
	}
	
	public long getPlanId() {
		return networkDataRequest.getPlanId() ;
	}

	public OptimizationConstraints getOptimizationConstraints() {
		return optimizationConstraints;
	}

	public NetworkDataRequest getNetworkDataRequest() {
		return networkDataRequest;
	}

	public FiberNetworkConstraints getConstraints() {
		return constraints;
	}

}
