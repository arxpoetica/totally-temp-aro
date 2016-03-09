package com.altvil.aro.service.entity;

import java.io.Serializable;

public interface LocationDemand extends Serializable {
    
	double getHouseholdFiberDemandValue();
	LocationEntityDemand getHouseholdFiberDemand();
	LocationEntityDemand getLocationDemand(LocationEntityType type) ;
	
    LocationDemand add(LocationDemand coverageStatic) ;
    
    
}


