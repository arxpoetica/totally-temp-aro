package com.altvil.aro.service.optimization.constraints;

import com.altvil.enumerations.OptimizationType;

public class ThresholdBudgetConstraint extends AbstractOptimizationConstraint {

	private double threshhold;
	private double capex;

	public ThresholdBudgetConstraint(OptimizationType optimizationType,
			int years, double discountRate, double threshhold, double capex, boolean forced) {
		super(optimizationType, years, discountRate, forced);
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
