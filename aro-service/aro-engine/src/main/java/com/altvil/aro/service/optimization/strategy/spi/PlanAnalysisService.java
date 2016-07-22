package com.altvil.aro.service.optimization.strategy.spi;

import java.util.function.Function;

import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.roic.RoicFinancialInput;

public interface PlanAnalysisService {

	Function<OptimizedNetwork, PlanAnalysis> createPlanAnalysis(int years,
			double discountRate);

	FinancialAnalysis createFinancialAnalysis(
			RoicFinancialInput financialInput, int years, double discountRate);

}
