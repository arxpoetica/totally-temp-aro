package com.altvil.aro.service.optimization.wirecenter;

import java.util.Optional;

import com.altvil.aro.service.graph.model.NetworkData;

public interface WirecenterOptimizationService {

	PrunedNetwork pruneNetwork(WirecenterOptimizationRequest request);
	Optional<PlannedNetwork> planNetwork(WirecenterOptimizationRequest request) ;
	Optional<PlannedNetwork> planNetwork(WirecenterOptimizationRequest request, NetworkData networkData) ;
	Optional<PlannedNetwork> planNpvNetwork(WirecenterOptimizationRequest request, NetworkData networkData) ;

}
