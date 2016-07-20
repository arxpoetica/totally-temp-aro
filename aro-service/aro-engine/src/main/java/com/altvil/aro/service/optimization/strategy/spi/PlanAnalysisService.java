package com.altvil.aro.service.optimization.strategy.spi;

import java.util.function.Function;

import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.roic.NetworkFinancialInput;

public interface PlanAnalysisService {
	
	Function<OptimizedNetwork, PlanAnalysis> createPlanAnalysis(int years, double discountRate) ;
	
	Function<NetworkFinancialInput, FinancialAnalysis> createFinancialAnalysis(int years, double discountRate) ;

}
