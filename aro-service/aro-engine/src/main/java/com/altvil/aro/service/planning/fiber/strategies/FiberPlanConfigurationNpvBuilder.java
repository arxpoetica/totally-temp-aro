package com.altvil.aro.service.planning.fiber.strategies;

import com.altvil.annotation.FiberPlanStrategy;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.NpvFiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfigurationBuilder;
import com.altvil.enumerations.FiberPlanAlgorithm;

@FiberPlanStrategy(type=FiberPlanConfigurationBuilder.class, algorithms=FiberPlanAlgorithm.NPV)
public class FiberPlanConfigurationNpvBuilder implements FiberPlanConfigurationBuilder {
	@SuppressWarnings("unchecked")
	@Override
	public FiberPlanConfigurationNpv build(FiberPlan fiberPlan) {
		return new FiberPlanConfigurationNpv((NpvFiberPlan) fiberPlan);
	}
}
