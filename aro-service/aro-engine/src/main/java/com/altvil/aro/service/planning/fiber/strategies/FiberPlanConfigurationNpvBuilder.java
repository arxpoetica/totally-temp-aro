package com.altvil.aro.service.planning.fiber.strategies;

import com.altvil.annotation.FiberPlanStrategy;
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.NpvFiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;
import com.altvil.aro.service.planning.fiber.FiberPlanConfigurationBuilder;
import com.altvil.enumerations.FiberPlanAlgorithm;

@FiberPlanStrategy(type=FiberPlanConfigurationBuilder.class, algorithms=FiberPlanAlgorithm.NPV)
public class FiberPlanConfigurationNpvBuilder implements FiberPlanConfigurationBuilder<NpvFiberPlan> {
	@Override
	public FiberPlanConfiguration<NpvFiberPlan> build(NpvFiberPlan fiberPlan) {
		return new FiberPlanConfigurationNpv(fiberPlan);
	}

}
