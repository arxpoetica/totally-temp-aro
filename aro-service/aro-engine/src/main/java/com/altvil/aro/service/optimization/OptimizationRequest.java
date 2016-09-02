package com.altvil.aro.service.optimization;

import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.AlgorithmType;

public class OptimizationRequest {

	protected OptimizationConstraints optimizationConstraints;
	protected FiberNetworkConstraints constraints;
	protected NetworkDataRequest networkDataRequest;
	protected AlgorithmType algorithmType;

	public OptimizationRequest(OptimizationConstraints optimizationConstraints,
			FiberNetworkConstraints constraints,
			NetworkDataRequest networkDataRequest,
			AlgorithmType algorithmType) {
		super();
		this.optimizationConstraints = optimizationConstraints;
		this.constraints = constraints;
		this.networkDataRequest = networkDataRequest;
		this.algorithmType = algorithmType ;
	}

	public AlgorithmType getAlgorithmType() {
		return algorithmType;
	}
	
	public long getPlanId() {
		return networkDataRequest.getPlanId();
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
