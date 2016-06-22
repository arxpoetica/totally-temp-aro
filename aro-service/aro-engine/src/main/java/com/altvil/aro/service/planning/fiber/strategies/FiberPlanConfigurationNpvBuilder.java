package com.altvil.aro.service.planning.fiber.strategies;

import org.springframework.beans.factory.annotation.Autowired;

import com.altvil.annotation.FiberPlanStrategy;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.GlobalConstraintBuilder;
import com.altvil.aro.service.planning.NpvFiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfigurationBuilder;
import com.altvil.aro.service.strategy.NoSuchStrategy;
import com.altvil.aro.service.strategy.StrategyService;
import com.altvil.enumerations.FiberPlanAlgorithm;

@FiberPlanStrategy(type=FiberPlanConfigurationBuilder.class, algorithms=FiberPlanAlgorithm.NPV)
public class FiberPlanConfigurationNpvBuilder implements FiberPlanConfigurationBuilder {
	@Autowired
	private StrategyService strategyService;

	@SuppressWarnings("unchecked")
	@Override
	public FiberPlanConfigurationNpv build(FiberPlan fiberPlan) throws NoSuchStrategy {
		GlobalConstraint globalConstraint = strategyService.getStrategy(
				GlobalConstraintBuilder.class, fiberPlan.getAlgorithm()).build(
						fiberPlan);
		return new FiberPlanConfigurationNpv((NpvFiberPlan) fiberPlan, globalConstraint);
	}
}
