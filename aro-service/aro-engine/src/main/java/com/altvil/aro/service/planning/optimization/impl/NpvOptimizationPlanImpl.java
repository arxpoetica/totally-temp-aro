package com.altvil.aro.service.planning.optimization.impl;

import com.altvil.aro.service.planning.NpvOptimizationPlan;
import com.altvil.enumerations.FiberPlanAlgorithm;

public class NpvOptimizationPlanImpl extends AbstractOptimizationPlan implements NpvOptimizationPlan{
	private double discountRate = Double.NaN;
	private int periods = -1;

	protected NpvOptimizationPlanImpl() {
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
