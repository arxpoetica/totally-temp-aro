package com.altvil.aro.service.entity;

import java.io.Serializable;
import java.util.Map;

public interface LocationDemand extends DemandStatistic, Serializable {
    
	Map<LocationEntityType, DemandStatistic> getEntityDemands() ;
	DemandStatistic getLocationDemand(LocationEntityType type) ;
	Pair<LocationDemand> splitDemand(double demand) ;
	
    
}


