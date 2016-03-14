package com.altvil.aro.service.optimize;

import java.util.Collection;
import java.util.Optional;

public interface NetworkPlanner {

	Optional<OptimizedNetwork> getNetworkPlan();

	Collection<OptimizedNetwork> getOptimizedPlans();

}
