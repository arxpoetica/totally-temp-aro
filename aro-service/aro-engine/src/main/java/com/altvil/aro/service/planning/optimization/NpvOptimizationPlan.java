package com.altvil.aro.service.planning.optimization;

import com.altvil.enumerations.FiberPlanAlgorithm;

public class NpvOptimizationPlan extends AbstractOptimizationPlan {
	private double discountRate = Double.NaN;
	private int periods = -1;

	protected NpvOptimizationPlan() {
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
