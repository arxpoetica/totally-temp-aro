package com.altvil.aro.service.planning.optimization;

import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.optimization.strategies.OptimizationPlanConfiguration;

public interface OptimizationPlanConfigurationBuilder<OP extends OptimizationPlanConfiguration> {
	 OP build(OptimizationPlan optimizationPlan);
}
