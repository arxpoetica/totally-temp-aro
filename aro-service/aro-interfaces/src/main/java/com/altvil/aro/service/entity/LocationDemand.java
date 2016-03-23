package com.altvil.aro.service.entity;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.function.Predicate;

public interface LocationDemand extends Serializable {
    
	
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
	
	default public Collection<LocationDemand> splitDemand(int maxDemand) {
		return Collections.singleton(this) ;
	}
	
    LocationDemand add(LocationDemand coverageStatic) ;
    
    
}


