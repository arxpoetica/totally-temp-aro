package com.altvil.aro.service.cost;

import java.util.Collection;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.price.engine.PriceModel;

public interface PlanAnalysisReport {

	PriceModel getPriceModel() ;
	LocationDemand getLocationDemand() ;
	Collection<NetworkStatistic> getNetworkStatistics() ;
	
}
