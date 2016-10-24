package com.altvil.aro.service.optimization.constraints;

import com.altvil.enumerations.OptimizationType;

public class CapexConstraints extends ThresholdBudgetConstraint {

	public CapexConstraints(OptimizationType optimizationType, int years,
			double discountRate, double threshhold, double capex, boolean forced) {
		super(optimizationType, years, discountRate, threshhold, capex, forced);
	}

}