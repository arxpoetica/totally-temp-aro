package com.altvil.aro.service.planing;

import com.altvil.aro.service.optimize.spi.ScoringStrategy;

public interface ScoringStrategyFactory {
	
	ScoringStrategy getScoringStrategy(OptimizationType optimizationType) ;

}
