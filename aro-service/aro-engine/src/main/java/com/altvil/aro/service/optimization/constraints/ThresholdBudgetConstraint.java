package com.altvil.aro.service.optimization.constraints;

import com.altvil.enumerations.OptimizationType;

public class ThresholdBudgetConstraint extends AbstractOptimizationConstraint {

	private double threshhold;
	private double capex;

	public ThresholdBudgetConstraint(OptimizationType optimizationType,
			int years, double discountRate, double threshhold, double capex) {
		super(optimizationType, years, discountRate);
		this.threshhold = threshhold;
		this.capex = capex;
	}

	public double getThreshhold() {
		return threshhold;
	}

	public double getCapex() {
		return capex;
	}

}
