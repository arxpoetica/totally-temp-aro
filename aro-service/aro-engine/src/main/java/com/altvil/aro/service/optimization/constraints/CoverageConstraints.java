package com.altvil.aro.service.optimization.constraints;

import com.altvil.enumerations.OptimizationType;

public class CoverageConstraints extends ThresholdBudgetConstraint {

	public CoverageConstraints(OptimizationType optimizationType, int years,
			double discountRate, double threshhold, double capex) {
		super(optimizationType, years, discountRate, threshhold, capex);
	}

}