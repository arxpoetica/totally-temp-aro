package com.altvil.aro.service.optimization;

import java.util.Map;

import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.AlgorithmType;

public class OptimizationRequest {
	
	public static final String CUSTOM_OPTIMIZATION_KEY = "$OPTIMIZATION$" ;

	protected OptimizationConstraints optimizationConstraints;
	protected FiberNetworkConstraints constraints;
	protected NetworkDataRequest networkDataRequest;
	protected AlgorithmType algorithmType;
	protected boolean usePlanConduit ;
	protected Map<String, String> extendedAttributes ;
	
	public OptimizationRequest(OptimizationConstraints optimizationConstraints,
			FiberNetworkConstraints constraints,
			NetworkDataRequest networkDataRequest,
			AlgorithmType algorithmType,
			boolean usePlanConduit,
			Map<String, String> extendedAttributes) {
		super();
		this.optimizationConstraints = optimizationConstraints;
		this.constraints = constraints;
		this.networkDataRequest = networkDataRequest;
		this.algorithmType = algorithmType ;
		this.usePlanConduit = usePlanConduit ;
		this.extendedAttributes = extendedAttributes ;
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

	public boolean isUsePlanConduit() {
		return usePlanConduit;
	}

	public Map<String, String> getExtendedAttributes() {
		return extendedAttributes;
	}
	
	
	
}
