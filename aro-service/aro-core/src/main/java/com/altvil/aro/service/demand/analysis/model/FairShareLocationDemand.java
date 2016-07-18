package com.altvil.aro.service.demand.analysis.model;

import com.altvil.aro.service.demand.DemandMapping;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;

public interface FairShareLocationDemand extends RevenueProducer {

	DemandStatistic createDemandStatistic(DemandMapping demandMapping,
			LocationEntityType type) ;
	
	LocationDemand createLocationDemand(DemandMapping demandMapping) ;
	
	FairShareDemandAnalysis getEffectiveNetworkDemand(LocationEntityType type);
	

}
