package com.altvil.aro.service.optimization.strategy;

import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimize.spi.PruningStrategy;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;

public interface OptimizationStrategyService {
	
	OptimizationStrategy getOptimizationStrategy(OptimizationConstraints constraints) ;
	PruningStrategy getPruningStrategy(OptimizationConstraints constraints) ;
	ScoringStrategy getScoringStrategy(OptimizationConstraints constraints) ;

}
