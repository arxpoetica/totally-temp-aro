package com.altvil.aro.service.optimization.wirecenter;

import java.util.Optional;
import java.util.function.Function;

import com.altvil.aro.service.graph.model.NetworkData;

public interface WirecenterOptimizationService {

	PrunedNetwork pruneNetwork(WirecenterOptimizationRequest request);

	Function<NetworkData, Optional<PlannedNetwork>> bindRequest(
			WirecenterOptimizationRequest request);

	Optional<PlannedNetwork> planNetwork(WirecenterOptimizationRequest request);

	Optional<PlannedNetwork> planNetwork(WirecenterOptimizationRequest request,
			NetworkData networkData);

	Optional<PlannedNetwork> planNpvNetwork(
			WirecenterOptimizationRequest request, NetworkData networkData);

}
