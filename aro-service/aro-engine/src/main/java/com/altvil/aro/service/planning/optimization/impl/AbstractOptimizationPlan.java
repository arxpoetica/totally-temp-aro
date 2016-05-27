package com.altvil.aro.service.planning.optimization.impl;

import com.altvil.aro.service.planing.OptimizationInputs;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;
import com.altvil.enumerations.OptimizationType;

public abstract class AbstractOptimizationPlan implements OptimizationPlan {
	private final OptimizationType optimizationType;
	private long						   planId;
	private int year = 2015;

	protected AbstractOptimizationPlan(OptimizationType optimizationType) {
		this.optimizationType = optimizationType;
	}

	@Override
	public OptimizationType getOptimizationType() {
		return optimizationType;
	}

	@Override
	public long getPlanId() {
		return planId;
	}

	public void setPlanId(long planId) {
		this.planId = planId;
	}

	@Override
	public int getYear() {
		return year;
	}

	public void setYear(int year) {
		this.year = year;
	}
	
	@SuppressWarnings("unchecked")
	@Override
	public <T> T dependentPlan(long dependentId) {
		try {
			AbstractOptimizationPlan copy = (AbstractOptimizationPlan) this.clone();
			copy.planId = planId;
			return (T) copy;
		} catch (CloneNotSupportedException e) {
		}
		
		return null;
	};
}
