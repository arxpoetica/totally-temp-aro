package com.altvil.aro.service.planing;

import com.altvil.aro.service.optimize.spi.ScoringStrategy;
import com.altvil.enumerations.OptimizationType;

@Deprecated
public interface ScoringStrategyFactory {
	
	ScoringStrategy getScoringStrategy(OptimizationType optimizationType) ;

}
