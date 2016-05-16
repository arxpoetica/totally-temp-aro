package com.altvil.aro.service.planning.fiber.strategies;

import com.altvil.annotation.FiberPlanStrategy;
import com.altvil.aro.service.planning.fiber.AbstractFiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;
import com.altvil.aro.service.planning.fiber.FiberPlanConfigurationBuilder;
import com.altvil.enumerations.FiberPlanAlgorithm;

@FiberPlanStrategy(type=FiberPlanConfigurationBuilder.class, algorithms=FiberPlanAlgorithm.NPV)
public class FiberPlanConfigurationNpvBuilder implements FiberPlanConfigurationBuilder {
	@Override
	public FiberPlanConfiguration build(AbstractFiberPlan fiberPlan) {
		return new FiberPlanConfigurationNpv(fiberPlan);
	}

}
