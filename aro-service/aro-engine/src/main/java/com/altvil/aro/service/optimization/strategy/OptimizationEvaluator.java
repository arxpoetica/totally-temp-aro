package com.altvil.aro.service.optimization.strategy;

import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimize.spi.PruningStrategy;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;

import java.util.Collection;

public interface OptimizationEvaluator {

	Collection<PlannedNetwork> evaluateNetworks(Collection<PrunedNetwork> analysis);

	//Optional<PlannedNetwork> evaluateNetwork(PrunedNetwork prunedNetwork);
	PruningStrategy getPruningStrategy() ;
	ScoringStrategy getScoringStrategy() ;

}
