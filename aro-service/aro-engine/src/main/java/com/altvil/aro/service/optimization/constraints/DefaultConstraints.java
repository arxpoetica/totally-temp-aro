package com.altvil.aro.service.optimization.constraints;

import com.altvil.enumerations.OptimizationType;

public class DefaultConstraints extends AbstractOptimizationConstraint {

	public DefaultConstraints(OptimizationType optimizationType) {
		super(optimizationType, 15, 0.06);
	}

}
