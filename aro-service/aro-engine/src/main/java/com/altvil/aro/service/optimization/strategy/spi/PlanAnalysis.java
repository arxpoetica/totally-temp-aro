package com.altvil.aro.service.optimization.strategy.spi;

import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.roic.NetworkFinancialInput;

public interface PlanAnalysis extends FinancialAnalysis {

	NetworkFinancialInput getNetworkFinancials() ;
	
	OptimizedNetwork getOptimizedNetwork();



}
