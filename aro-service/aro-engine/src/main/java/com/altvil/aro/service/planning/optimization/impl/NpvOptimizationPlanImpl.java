package com.altvil.aro.service.planning.optimization.impl;

import com.altvil.aro.service.planning.NpvOptimizationPlan;
import com.altvil.enumerations.OptimizationType;

public class NpvOptimizationPlanImpl extends AbstractOptimizationPlan implements NpvOptimizationPlan{
	private double budget = Double.POSITIVE_INFINITY;
	private double discountRate = Double.NaN;
	private int years = -1;

	protected NpvOptimizationPlanImpl() {
		super(OptimizationType.NPV);
	}

	public double getBudget() {
		return budget;
	}

	public double getDiscountRate() {
		return discountRate;
	}

	public int getYears() {
		return years;
	}

	public void setBudget(double budget) {
		this.budget = budget;
	}

	public void setDiscountRate(double discountRate) {
		this.discountRate = discountRate;
	}

	public void setYears(int years) {
		this.years = years;
	}
}
