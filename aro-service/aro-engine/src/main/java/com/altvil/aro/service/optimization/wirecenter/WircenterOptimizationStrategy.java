package com.altvil.aro.service.optimization.wirecenter;

import java.util.Optional;

public interface WircenterOptimizationStrategy {
	
	Optional<PlannedNetwork> optimize() ;

}
