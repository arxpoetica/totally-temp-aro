package com.altvil.aro.service.entity;

import java.io.Serializable;
import java.util.Collection;

public interface LocationDemand extends DemandStatistic, Serializable {
    
	Collection<DemandStatistic> getEntityDemands() ;
	DemandStatistic getLocationDemand(LocationEntityType type) ;
	Pair<LocationDemand> splitDemand(double demand) ;
	
    
}


