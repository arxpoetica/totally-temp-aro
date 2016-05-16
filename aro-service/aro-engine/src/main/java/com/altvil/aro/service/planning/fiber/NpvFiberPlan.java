package com.altvil.aro.service.planning.fiber;

import com.altvil.enumerations.FiberPlanAlgorithm;

public class NpvFiberPlan extends AbstractFiberPlan {
	private double discountRate = Double.NaN;
	private int periods = -1;

	protected NpvFiberPlan() {
		super(FiberPlanAlgorithm.NPV);
	}

	public double getDiscountRate() {
		return discountRate;
	}

	public int getPeriods() {
		return periods;
	}

	public void setDiscountRate(double discountRate) {
		this.discountRate = discountRate;
	}

	public void setPeriods(int periods) {
		this.periods = periods;
	}
}
