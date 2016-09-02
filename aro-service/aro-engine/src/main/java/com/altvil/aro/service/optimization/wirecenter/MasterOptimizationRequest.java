package com.altvil.aro.service.optimization.wirecenter;

import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.optimization.OptimizationRequest;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.AlgorithmType;
import com.altvil.enumerations.OptimizationMode;

public class MasterOptimizationRequest extends OptimizationRequest {

	private final OptimizationMode optimizationMode;
	private ServiceLayer processingLayer;

	public MasterOptimizationRequest(ServiceLayer processingLayer,
			OptimizationConstraints optimizationConstraints,
			FiberNetworkConstraints constraints, NetworkDataRequest request,
			OptimizationMode optimizationMode, AlgorithmType algorithmType) {
		super(optimizationConstraints, constraints, request, algorithmType);
		this.processingLayer = processingLayer;
		this.optimizationMode = optimizationMode;
	}

	public MasterOptimizationRequest includePlanConduit() {
		return new MasterOptimizationRequest(processingLayer,
				optimizationConstraints, constraints, getNetworkDataRequest()
						.includePlanConduit(), optimizationMode, algorithmType);
	}

	public ServiceLayer getProcessingLayer() {
		return processingLayer;
	}

	public OptimizationMode getOptimizationMode() {
		return optimizationMode;
	}
}
