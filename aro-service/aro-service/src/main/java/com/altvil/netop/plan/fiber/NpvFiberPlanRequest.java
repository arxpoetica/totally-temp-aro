package com.altvil.netop.plan.fiber;

import com.altvil.enumerations.FiberPlanAlgorithm;

@Deprecated
public class NpvFiberPlanRequest extends AbstractFiberPlanRequest {
	private double discountRate = Double.NaN;
	private int periods = -1;

	protected NpvFiberPlanRequest() {
		super(FiberPlanAlgorithm.NPV);
	}

	public double getDiscountRate() {
		return discountRate;
	}

	public int getYears() {
		return periods;
	}

	public void setDiscountRate(double discountRate) {
		this.discountRate = discountRate;
	}

	public void setPeriods(int periods) {
		this.periods = periods;
	}
}
