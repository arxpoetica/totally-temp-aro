package com.altvil.aro.service.planning.impl.strategies;

import com.altvil.annotation.FiberPlanDefaultStrategy;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.planning.FiberNetworkConstraintsBuilder;
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

			@Override
			public boolean isConverging(DAGModel<GeoSegment> model) {
				return false;
			}};
	}
}
