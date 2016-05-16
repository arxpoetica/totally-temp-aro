package com.altvil.aro.service.planning.fiber.strategies;

import com.altvil.annotation.FiberPlanDefaultStrategy;
import com.altvil.aro.service.planning.fiber.AbstractFiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;
import com.altvil.aro.service.planning.fiber.FiberPlanConfigurationBuilder;

@FiberPlanDefaultStrategy(type=FiberPlanConfigurationBuilder.class)
public class FiberPlanConfigurationDefaultBuilder implements FiberPlanConfigurationBuilder {
	@Override
	public FiberPlanConfiguration build(AbstractFiberPlan fiberPlan) {
		return new FiberPlanDefaultConfiguration(fiberPlan);
	}
}
