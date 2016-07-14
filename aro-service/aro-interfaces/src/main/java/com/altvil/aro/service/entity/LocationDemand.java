package com.altvil.aro.service.entity;

import java.io.Serializable;

public interface LocationDemand extends DemandStatistic, Serializable {
    
	DemandStatistic getLocationDemand(LocationEntityType type) ;
	
	Pair<LocationDemand> splitDemand(double demand) ;
	
    
}


