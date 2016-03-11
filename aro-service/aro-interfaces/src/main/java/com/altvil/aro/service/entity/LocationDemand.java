package com.altvil.aro.service.entity;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.function.Predicate;

public interface LocationDemand extends Serializable {
    
	double getHouseholdFiberDemandValue();
	LocationEntityDemand getHouseholdFiberDemand();
	LocationEntityDemand getLocationDemand(LocationEntityType type) ;
	
	public double getTotalDemand() ;
	default public Collection<LocationEntityDemand> filterDemands(Predicate<LocationEntityDemand> predicate) {
		LocationEntityType[] types = LocationEntityType.values() ;
		List<LocationEntityDemand> result = new ArrayList<>(types.length) ;
		
		for(LocationEntityType lt : types) {
			LocationEntityDemand  ld = getLocationDemand(lt) ;
			if(predicate.test(ld)) {
				result.add(ld) ;
			}
		}
		
		return result ;
	}
	
    LocationDemand add(LocationDemand coverageStatic) ;
    
    
}


