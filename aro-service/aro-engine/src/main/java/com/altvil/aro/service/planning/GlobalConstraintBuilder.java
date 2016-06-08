package com.altvil.aro.service.planning;

import com.altvil.aro.service.plan.GlobalConstraint;

public interface GlobalConstraintBuilder {
	GlobalConstraint build(FiberPlan fiberPlan);
}
