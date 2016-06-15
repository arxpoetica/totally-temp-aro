package com.altvil.aro.service.planning.optimization.impl;

import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.enumerations.OptimizationType;

public class MaxIrrOptimizationPlanImpl extends AbstractOptimizationPlan implements OptimizationPlan {
	public MaxIrrOptimizationPlanImpl() {
		super(OptimizationType.MAX_IRR);
	}
}
