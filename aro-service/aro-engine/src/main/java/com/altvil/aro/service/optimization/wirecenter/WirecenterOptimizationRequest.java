package com.altvil.aro.service.optimization.wirecenter;

import java.util.Collection;

import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.optimization.OptimizationRequest;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.price.ConstructionRatios;
import com.altvil.enumerations.AlgorithmType;

public class WirecenterOptimizationRequest extends OptimizationRequest {

	private ConstructionRatios constructionRatios = ConstructionRatios.DEFAULT;
	private Collection<String> stateCodes ;
	
	public WirecenterOptimizationRequest(
			OptimizationConstraints optimizationConstraints,
			FiberNetworkConstraints networkConstraints,
			NetworkDataRequest networkDataRequest, AlgorithmType algorithmType, boolean usePlanConduit) {
		super(optimizationConstraints, networkConstraints, networkDataRequest,
				algorithmType, usePlanConduit);
	}

	public ConstructionRatios getConstructionRatios() {
		return constructionRatios;
	}

	public Collection<String> getStateCodes() {
		return stateCodes;
	}
	
	

}
