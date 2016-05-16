package com.altvil.aro.service.planning.fiber;

import com.altvil.aro.service.planning.FiberPlan;

public interface FiberPlanConfigurationBuilder<FP extends FiberPlan> {
	  FiberPlanConfiguration<FP> build(FP fiberPlan );
}
