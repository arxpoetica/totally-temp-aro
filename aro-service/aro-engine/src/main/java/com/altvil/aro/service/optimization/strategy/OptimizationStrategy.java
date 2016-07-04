package com.altvil.aro.service.optimization.strategy;

import java.util.Collection;
import java.util.Optional;

import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;

public interface OptimizationStrategy {

	Collection<PlannedNetwork> evaluateNetworks(Collection<PrunedNetwork> analysis);

	Optional<PlannedNetwork> evaluateNetwork(PrunedNetwork prunedNetwork);

}
