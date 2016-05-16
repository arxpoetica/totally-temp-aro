package com.altvil.aro.service.planning.optimization;

import com.altvil.aro.service.planning.NpvOptimizationPlan;
import com.altvil.aro.service.planning.OptimizationPlan;

public interface OptimizationPlanConfigurationBuilder<OP extends OptimizationPlan> {
	OptimizationPlanConfiguration<OP> build(OP fiberPlan);
}
