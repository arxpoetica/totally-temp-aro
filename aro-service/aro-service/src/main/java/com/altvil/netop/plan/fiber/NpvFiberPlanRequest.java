package com.altvil.netop.plan.fiber;

public class NpvFiberPlanRequest extends AbstractFiberPlanRequest {
	private double discountRate = Double.NaN;
	private int periods = -1;

	protected NpvFiberPlanRequest() {
		super("NPV");
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
