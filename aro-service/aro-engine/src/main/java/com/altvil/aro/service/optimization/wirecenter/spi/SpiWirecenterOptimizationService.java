package com.altvil.aro.service.optimization.wirecenter.spi;

import java.util.Optional;
import java.util.function.Function;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;

public interface SpiWirecenterOptimizationService {
	
	Function<NetworkData, Optional<PlannedNetwork>> bindRequest(
			WirecenterOptimizationRequest request);

}
