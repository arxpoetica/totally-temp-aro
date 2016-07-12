package com.altvil.aro.service.entity;

public interface DemandStatistic {
	
	double getRawCoverage(); //Counts of entities A.K.A Premises Passed

	double getAtomicUnits() ; //Fiber Units Consumed network
	
	double getTotalRevenue() ;
	double getMonthlyRevenueImpact() ; //Revenue Impact
	
	//penetration = raw / coverage 
	double getPenetration() ; // penetration
	double getFairShareDemand(); //Demand Modified by penetration
	
	

}
