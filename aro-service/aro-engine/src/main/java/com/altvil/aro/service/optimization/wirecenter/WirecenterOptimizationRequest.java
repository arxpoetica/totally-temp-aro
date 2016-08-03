package com.altvil.aro.service.optimization.wirecenter;

import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.optimization.OptimizationRequest;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.price.ConstructionRatios;

public class WirecenterOptimizationRequest extends OptimizationRequest {

	private ConstructionRatios constructionRatios = ConstructionRatios.DEFAULT;

	public WirecenterOptimizationRequest(
			OptimizationConstraints optimizationConstraints,
			FiberNetworkConstraints networkConstraints,
			NetworkDataRequest networkDataRequest) {
		super(optimizationConstraints, networkConstraints, networkDataRequest);
	}

	public ConstructionRatios getConstructionRatios() {
		return constructionRatios;
	}

}
