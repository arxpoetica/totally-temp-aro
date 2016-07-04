package com.altvil.aro.service.optimization.wirecenter;

import java.util.Optional;


public interface WirecenterOptimizationService {

	PrunedNetwork pruneNetwork(WirecenterOptimizationRequest request);
	Optional<PlannedNetwork> planNetwork(WirecenterOptimizationRequest request) ;

}
