package com.altvil.aro.service.planning.fiber.strategies;

import com.altvil.annotation.FiberPlanDefaultStrategy;
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;
import com.altvil.aro.service.planning.fiber.FiberPlanConfigurationBuilder;

@FiberPlanDefaultStrategy(type=FiberPlanConfigurationBuilder.class)
public class FiberPlanConfigurationDefaultBuilder implements FiberPlanConfigurationBuilder<FiberPlan> {
	@Override
	public FiberPlanConfiguration<FiberPlan> build(FiberPlan fiberPlan) {
		return new FiberPlanDefaultConfiguration<>(fiberPlan);
	}
}
