package com.altvil.aro.service.optimization.strategy;

import java.util.Optional;

import com.altvil.aro.service.optimization.master.MasterOptimizationResult;
import com.altvil.aro.service.optimization.wirecenter.OptimizationResult;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;

public interface OptimizationStrategy {

	MasterOptimizationResult<PlannedNetwork> evaluateNetworks(MasterOptimizationResult<PrunedNetwork> analysis);

	Optional<PlannedNetwork> evaluateNetwork(OptimizationResult<PrunedNetwork> prunedNetwork);

}
