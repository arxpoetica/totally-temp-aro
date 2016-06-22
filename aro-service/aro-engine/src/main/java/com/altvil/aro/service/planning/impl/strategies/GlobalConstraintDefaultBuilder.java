package com.altvil.aro.service.planning.impl.strategies;

import com.altvil.annotation.FiberPlanDefaultStrategy;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.GlobalConstraintBuilder;

@FiberPlanDefaultStrategy(type = GlobalConstraintBuilder.class)
public class GlobalConstraintDefaultBuilder implements GlobalConstraintBuilder {
	@Override
	public GlobalConstraint build(FiberPlan fiberPlan) {
		return new GlobalConstraint() {
			@Override
			public double nextParametric() {
				return 1;
			}

			// TODO Move WirecenterNetworkPlan from engine to core then use it
			// in place of Object.
			@Override
			public boolean isConverging(Object object) {
				return false;
			}
		};
	}
}
