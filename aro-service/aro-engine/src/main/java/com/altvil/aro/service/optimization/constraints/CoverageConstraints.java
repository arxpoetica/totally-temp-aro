package com.altvil.aro.service.optimization.constraints;

import com.altvil.enumerations.OptimizationType;

public class CoverageConstraints extends ThresholdBudgetConstraint {

	public CoverageConstraints(int years,
			double discountRate, double threshhold, double capex) {
		super(OptimizationType.COVERAGE, years, discountRate, threshhold, capex);
	}

}