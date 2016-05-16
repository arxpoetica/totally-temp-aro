package com.altvil.aro.service.planning.fiber.strategies;

import com.altvil.aro.service.planning.fiber.AbstractFiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;

public abstract class AbstractFiberPlanConfiguration  implements Cloneable, FiberPlanConfiguration {

	protected AbstractFiberPlan fiberPlan;

	public AbstractFiberPlanConfiguration(AbstractFiberPlan fiberPlan) {
		this.fiberPlan = fiberPlan;
	}

	@Override
	public AbstractFiberPlan getFiberPlan() {
		return fiberPlan;
	}

	@Override
	public <T extends FiberPlanConfiguration> T dependentPlan(long dependentId) {
		try {
			@SuppressWarnings("unchecked")
			T copy = (T) clone();
			((AbstractFiberPlanConfiguration) copy).fiberPlan = fiberPlan.dependentFiberPlan(dependentId);
			
			return copy;
		} catch (CloneNotSupportedException e) {
		}
		
		return null;
	}
}
