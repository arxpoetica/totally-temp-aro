package com.altvil.aro.service.optimization.strategy.spi;

import com.altvil.aro.service.optimize.OptimizedNetwork;

public interface PlanAnalysis {

	NetworkFinancials getNetworkFinancials() ;
	
	FinancialAnalysis getFinancialAnalysis() ;
	
	OptimizedNetwork getOptimizedNetwork();



}
