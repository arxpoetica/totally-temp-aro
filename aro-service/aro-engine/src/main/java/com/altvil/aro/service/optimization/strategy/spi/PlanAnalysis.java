package com.altvil.aro.service.optimization.strategy.spi;

import com.altvil.aro.service.optimize.OptimizedNetwork;

public interface PlanAnalysis {

	boolean isValid();

	OptimizedNetwork getOptimizedNetwork();

	double getIrr();

	double getNpv();

	double getScore();

	double getBudget();
	
	double getCoverage() ;

}
