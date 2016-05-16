package com.altvil.aro.service.planning.optimization.impl;

import com.altvil.aro.service.planing.OptimizationType;
import com.altvil.aro.service.planning.NpvOptimizationPlan;
import com.altvil.enumerations.FiberPlanAlgorithm;

public class NpvOptimizationPlanImpl extends AbstractOptimizationPlan implements NpvOptimizationPlan{
	private double discountRate = Double.NaN;
	private int periods = -1;
	private double coverage;
	private OptimizationType optimizationType;

	public double getCoverage() {
		return coverage;
	}

	public void setCoverage(double coverage) {
		this.coverage = coverage;
	}

	public OptimizationType getOptimizationType() {
		return optimizationType;
	}

	public void setOptimizationType(OptimizationType optimizationType) {
		this.optimizationType = optimizationType;
	}

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
