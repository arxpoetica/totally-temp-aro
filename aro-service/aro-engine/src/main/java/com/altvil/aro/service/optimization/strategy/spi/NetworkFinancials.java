package com.altvil.aro.service.optimization.strategy.spi;

import com.altvil.aro.service.entity.LocationDemand;

public interface NetworkFinancials {
	
	boolean isValid() ;
	
	double getPenetration() ;
	double getAnnualRevenue() ;
	double getFixedCosts() ;
	
	LocationDemand getLocationDemand() ; //??
	
	double getNetworkRunningCosts() ; //Percent
}
