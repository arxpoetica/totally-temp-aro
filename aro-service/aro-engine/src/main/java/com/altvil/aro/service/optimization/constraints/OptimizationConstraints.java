package com.altvil.aro.service.optimization.constraints;

import com.altvil.enumerations.OptimizationType;

public interface OptimizationConstraints {

	OptimizationType getOptimizationType();
	int getYears() ;
	double getDiscountRate() ;
	boolean isForced();

}
