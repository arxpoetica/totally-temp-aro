package com.altvil.aro.service.entity;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.function.Predicate;

public interface LocationDemand extends Serializable {
    
	
	LocationEntityDemandByType getLocationDemand(LocationEntityType type) ;
	
	public double getTotalDemand() ;

	default public Collection<LocationEntityDemandByType> filterDemands(Predicate<LocationEntityDemandByType> predicate) {
		LocationEntityType[] types = LocationEntityType.values() ;
		List<LocationEntityDemandByType> result = new ArrayList<>(types.length) ;
		
		for(LocationEntityType lt : types) {
			LocationEntityDemandByType  ld = getLocationDemand(lt) ;
			if(predicate.test(ld)) {
				result.add(ld) ;
			}
		}
		
		return result ;
	}
	
	 Pair<LocationDemand> splitDemand(double demand) ;
	
    LocationDemand add(LocationDemand coverageStatic) ;
    
    
}


