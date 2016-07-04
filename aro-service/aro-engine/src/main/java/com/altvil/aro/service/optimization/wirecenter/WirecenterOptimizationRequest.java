package com.altvil.aro.service.optimization.wirecenter;

import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.optimization.OptimizationRequest;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.plan.FiberNetworkConstraints;

public class WirecenterOptimizationRequest extends OptimizationRequest {

	public WirecenterOptimizationRequest(
			OptimizationConstraints optimizationConstraints,
			FiberNetworkConstraints networkConstraints,
			NetworkDataRequest networkDataRequest) {
		super(optimizationConstraints, networkConstraints, networkDataRequest);
	}
}
