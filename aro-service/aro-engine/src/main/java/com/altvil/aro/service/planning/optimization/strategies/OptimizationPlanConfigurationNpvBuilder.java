package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.annotation.FiberPlanStrategy;
import com.altvil.aro.service.planing.OptimizationType;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfigurationNpv;
import com.altvil.aro.service.planning.optimization.AbstractOptimizationPlan;
import com.altvil.aro.service.planning.optimization.NpvOptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfiguration;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfigurationBuilder;
import com.altvil.enumerations.FiberPlanAlgorithm;

@FiberPlanStrategy(type=OptimizationPlanConfigurationBuilder.class, algorithms=FiberPlanAlgorithm.NPV)
public class OptimizationPlanConfigurationNpvBuilder implements OptimizationPlanConfigurationBuilder {
	public class OptimizationPlanConfigurationNpv extends FiberPlanConfigurationNpv implements OptimizationPlanConfiguration {
		private final NpvOptimizationPlan fiberPlan;
		
		public OptimizationPlanConfigurationNpv(AbstractOptimizationPlan fiberPlan) {
			super(fiberPlan);
			this.fiberPlan = (NpvOptimizationPlan) fiberPlan;
		}

		@Override
		public AbstractOptimizationPlan getOptimizationPlan() {
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
	public OptimizationPlanConfiguration build(AbstractOptimizationPlan fiberPlan) {
		return new OptimizationPlanConfigurationNpv(fiberPlan);
	}

}
