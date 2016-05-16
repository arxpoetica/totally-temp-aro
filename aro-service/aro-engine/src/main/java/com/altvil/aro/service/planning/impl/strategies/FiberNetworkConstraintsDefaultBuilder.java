package com.altvil.aro.service.planning.impl.strategies;

import com.altvil.annotation.FiberPlanDefaultStrategy;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planning.FiberNetworkConstraintsBuilder;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;

@FiberPlanDefaultStrategy(type=FiberNetworkConstraintsBuilder.class)
public class FiberNetworkConstraintsDefaultBuilder implements FiberNetworkConstraintsBuilder {

	@Override
	public FiberNetworkConstraints build(FiberPlan fiberPlan) {
		return new FiberNetworkConstraints();
	}
	
}
