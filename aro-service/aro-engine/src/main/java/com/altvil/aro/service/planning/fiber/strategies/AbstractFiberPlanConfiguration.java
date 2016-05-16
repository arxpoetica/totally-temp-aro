package com.altvil.aro.service.planning.fiber.strategies;

import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;

public abstract class AbstractFiberPlanConfiguration<FP extends FiberPlan>  implements Cloneable, FiberPlanConfiguration<FP> {

	protected FP fiberPlan;

	public AbstractFiberPlanConfiguration(FP fiberPlan) {
		this.fiberPlan = fiberPlan;
	}

	@Override
	public FP getFiberPlan() {
		return fiberPlan;
	}

	@Override
	public final <T extends FiberPlanConfiguration<FP>> T dependentPlan(long dependentId) {
		try {
			@SuppressWarnings("unchecked")
			T copy = (T) clone();
			final FP dependentFiberPlan = fiberPlan.dependentFiberPlan(dependentId);
			((AbstractFiberPlanConfiguration<FP>) copy).fiberPlan = dependentFiberPlan;
			
			return copy;
		} catch (CloneNotSupportedException e) {
		}
		
		return null;
	}
}
