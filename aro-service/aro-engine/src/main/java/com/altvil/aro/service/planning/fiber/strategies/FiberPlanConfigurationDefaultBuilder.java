package com.altvil.aro.service.planning.fiber.strategies;

import com.altvil.annotation.FiberPlanDefaultStrategy;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfigurationBuilder;

@FiberPlanDefaultStrategy(type = FiberPlanConfigurationBuilder.class)
public class FiberPlanConfigurationDefaultBuilder implements FiberPlanConfigurationBuilder {
	@SuppressWarnings("unchecked")
	@Override
	public FiberPlanConfiguration build(FiberPlan fiberPlan) {
		return new FiberPlanConfiguration(fiberPlan);
	}
}
