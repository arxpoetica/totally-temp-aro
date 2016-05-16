package com.altvil.aro.service.planning.fiber.impl;

import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.enumerations.FiberPlanAlgorithm;

public abstract class AbstractFiberPlan implements Cloneable, FiberPlan {
	private final FiberPlanAlgorithm algorithm;
	private long						   planId;
	private int year;

	protected AbstractFiberPlan(FiberPlanAlgorithm algorithm) {
		this.algorithm = algorithm;
	}

	@Override
	public FiberPlanAlgorithm getAlgorithm() {
		return algorithm;
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
	
	public final <T extends AbstractFiberPlan> T dependentFiberPlan(long planId) {
		try {
			@SuppressWarnings("unchecked")
			T copy = (T) this.clone();
			copy.setPlanId(planId);
			return copy;
		} catch (CloneNotSupportedException e) {
		}
		
		return null;
	};
}
