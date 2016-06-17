package com.altvil.aro.service.planning.fiber;

import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfiguration;
import com.altvil.aro.service.strategy.NoSuchStrategy;

public interface FiberPlanConfigurationBuilder   {
	<FPC extends FiberPlanConfiguration> FPC build(FiberPlan fiberPlan ) throws NoSuchStrategy;
}
