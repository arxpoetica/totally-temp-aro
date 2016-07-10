package com.altvil.aro.service.entity;

public interface DemandStatistic {
	
	double getRawCoverage(); //Premises Passed

	double getAtomicUnits() ; //Units Demanded From network
	
	double getDemand(); //Effective Demand
	
	double getMonthlyRevenueImpact() ; //Revenue Impact
	
	double getFairShare() ; //AKA as penetration
	

}
