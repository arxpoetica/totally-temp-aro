package com.altvil.aro.service.optimization.strategy.spi;

import java.util.function.Function;

import com.altvil.aro.service.optimize.OptimizedNetwork;

public interface PlanAnalysisService {
	
	Function<OptimizedNetwork, PlanAnalysis> createPlanAnalysis(int years, double discountRate) ;
	
	Function<NetworkFinancials, FinancialAnalysis> createFinancialAnalysis(int years, double discountRate) ;

}
