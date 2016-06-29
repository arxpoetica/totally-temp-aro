package com.altvil.aro.service.optimization.strategy;

import java.util.Collection;
import java.util.Optional;

import com.altvil.aro.service.optimization.master.PruningAnalysis;
import com.altvil.aro.service.optimization.wirecenter.OptimizedWirecenter;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;

public interface OptimizationStrategy {

	Collection<OptimizedWirecenter> evaluateNetworks(PruningAnalysis analysis);

	Optional<OptimizedWirecenter> evaluateNetwork(PrunedNetwork prunedNetwork);

}
