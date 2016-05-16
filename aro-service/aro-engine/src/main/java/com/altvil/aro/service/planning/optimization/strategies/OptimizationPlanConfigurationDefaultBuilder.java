package com.altvil.aro.service.planning.optimization.strategies;

import com.altvil.annotation.FiberPlanDefaultStrategy;
import com.altvil.aro.service.planing.OptimizationType;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanDefaultConfiguration;
import com.altvil.aro.service.planning.optimization.AbstractOptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfiguration;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfigurationBuilder;

@FiberPlanDefaultStrategy(type=OptimizationPlanConfigurationBuilder.class)
public class OptimizationPlanConfigurationDefaultBuilder implements OptimizationPlanConfigurationBuilder {
	public class OptimizationPlanDefaultConfiguration extends FiberPlanDefaultConfiguration implements OptimizationPlanConfiguration {
		private final AbstractOptimizationPlan fiberPlan;
		
		public OptimizationPlanDefaultConfiguration(AbstractOptimizationPlan fiberPlan) {
			super(fiberPlan);
			this.fiberPlan = fiberPlan;
		}

		
		@Override
		public AbstractOptimizationPlan getOptimizationPlan() {
			return fiberPlan;
		}
		
		@Override
		public OptimizationType getOptimizationType() {
			return OptimizationType.COVERAGE;
		}

		@Override
		public double getCoverage() {
			return 0.5;
		}
	}

	@Override
	public OptimizationPlanConfiguration build(AbstractOptimizationPlan fiberPlan) {
		return new OptimizationPlanDefaultConfiguration(fiberPlan);
	}

}
