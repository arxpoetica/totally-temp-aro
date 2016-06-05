package com.altvil.aro.service.entity;

public interface DemandStatistic {
	
	double getRawCoverage();

	double getDemand();
	
	double getMonthlyRevenueImpact() ;
	
	DemandStatistic ratio(double ratio) ;


}
