package com.altvil.aro.service.demand;

import com.altvil.aro.service.entity.DemandStatistic;

public interface CompositeNetworkStatistic extends DemandStatistic {

	//Implied LocationEntityTYpe
	
	//V1.rawCoverage - V2.rawCoverage
	//V1.atomicCoverage - V2.atomicCoverage
	//V1.totalRevenue - V2.totalRevenue
	//v1.mnthylyRevenue - V2.monthlyRevenue
	
	//penetration = raw / coverage 
	double getPenetration() ; // penetration
	double getFairShareDemand(); //Demand Modified by penetration
	
	
	//(Vector 1)  - (Vector 2)
	
	
	// FIBER BUILT => BROADBAND cat7 / cat3 = 0
	// Vector1  Speed cat7
	//
	// Product (cat7 S5)
	ProductDemandStatistic getPrimaryProductDemand() ;
	
	
	
	/////////////// OPTIMIZED
	
	double getCashFlow() ; // MonthlyRevenue - Cost (%Revenue)
	
	
	
	//  ORGINAL cat 3
	//
	// cat 3  (Revenue) 
	//
	ProductDemandStatistic getIntersectedDemand() ; 
	

	
}
