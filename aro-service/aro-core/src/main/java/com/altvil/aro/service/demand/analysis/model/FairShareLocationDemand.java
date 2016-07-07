package com.altvil.aro.service.demand.analysis.model;

import com.altvil.aro.service.demand.DemandMapping;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;

public interface FairShareLocationDemand extends RevenueProducer {

	LocationDemand createLocationDemand(DemandMapping demandMapping) ;
	
	FairShareDemandAnalysis getEffectiveNetworkDemand(LocationEntityType type);
	

}
