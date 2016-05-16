package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.annotation.FiberPlanStrategy;
import com.altvil.aro.service.planing.OptimizationType;
import com.altvil.aro.service.planning.NpvOptimizationPlan;
import com.altvil.aro.service.planning.fiber.strategies.AbstractFiberPlanConfigurationNpv;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfigurationNpv;
import com.altvil.aro.service.planning.optimization.impl.AbstractOptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfiguration;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfigurationBuilder;
import com.altvil.enumerations.FiberPlanAlgorithm;

@FiberPlanStrategy(type=OptimizationPlanConfigurationBuilder.class, algorithms=FiberPlanAlgorithm.NPV)
public class OptimizationPlanConfigurationNpvBuilder implements OptimizationPlanConfigurationBuilder<NpvOptimizationPlan> {
	public class OptimizationPlanConfigurationNpv extends AbstractFiberPlanConfigurationNpv<NpvOptimizationPlan> implements OptimizationPlanConfiguration<NpvOptimizationPlan> {
		public OptimizationPlanConfigurationNpv(NpvOptimizationPlan fiberPlan) {
			super(fiberPlan);
		}

		@Override
		public NpvOptimizationPlan getOptimizationPlan() {
			return fiberPlan;
		}
		
		public double getCoverage() {
			return 0;
		}

		public OptimizationType getOptimizationType() {
			return null;
		}
	}

	@Override
	public OptimizationPlanConfiguration<NpvOptimizationPlan> build(NpvOptimizationPlan fiberPlan) {
		return new OptimizationPlanConfigurationNpv(fiberPlan);
	}

}
