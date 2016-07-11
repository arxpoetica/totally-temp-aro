package com.altvil.aro.service.entity;

public interface DemandStatistic {
	
	double getRawCoverage(); //Counts of entities A.K.A Premises Passed

	double getAtomicUnits() ; //Fiber Units Consumed network
	
	double getFairShareDemand(); //Demand Modified by penetration
	
	double getMonthlyRevenueImpact() ; //Revenue Impact
	
	double getPenetration() ; // penetration
	

}
