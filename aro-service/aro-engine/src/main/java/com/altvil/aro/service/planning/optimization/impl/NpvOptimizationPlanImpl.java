package com.altvil.aro.service.planning.optimization.impl;

import com.altvil.aro.service.planning.NpvOptimizationPlan;
import com.altvil.enumerations.FiberPlanAlgorithm;

public class NpvOptimizationPlanImpl extends AbstractOptimizationPlan implements NpvOptimizationPlan{
	private double discountRate = Double.NaN;
	private int years = -1;

	protected NpvOptimizationPlanImpl() {
		super(FiberPlanAlgorithm.NPV);
	}

	public double getDiscountRate() {
		return discountRate;
	}

	public int getYears() {
		return years;
	}

	public void setDiscountRate(double discountRate) {
		this.discountRate = discountRate;
	}

	public void setYears(int years) {
		this.years = years;
	}
}
