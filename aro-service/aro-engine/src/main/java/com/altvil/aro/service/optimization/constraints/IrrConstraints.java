package com.altvil.aro.service.optimization.constraints;

import com.altvil.enumerations.OptimizationType;

public class IrrConstraints extends ThresholdBudgetConstraint {

	public IrrConstraints(OptimizationType optimizationType, int years,
			double discountRate, double threshhold, double capex) {
		super(optimizationType, years, discountRate, threshhold, capex);
	}	

}
