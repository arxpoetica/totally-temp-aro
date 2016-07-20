package com.altvil.aro.service.optimization.strategy.spi;


public interface FinancialAnalysis {
	
	boolean isValid();

	double getIrr();

	double getNpv();

	double getBudget();
	
	double getCoverage() ;


}
