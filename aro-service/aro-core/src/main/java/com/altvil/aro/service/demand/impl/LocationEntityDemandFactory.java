package com.altvil.aro.service.demand.impl;

import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.service.entity.LocationEntityDemandByType;
import com.altvil.aro.service.entity.LocationEntityType;

public class LocationEntityDemandFactory {

	public static final LocationEntityDemandFactory FACTORY = new LocationEntityDemandFactory() ;
	
	private Map<LocationEntityType, LocationEntityDemandByType> zeroDemand = new EnumMap<>(LocationEntityType.class) ;
	
	private LocationEntityDemandFactory() {
		for(LocationEntityType t : LocationEntityType.values()) {
			zeroDemand.put(t, new DefaultLocationEntityDemand(t,0)) ;
		}
	}

	public LocationEntityDemandByType create(LocationEntityType type, double demand) {
		return demand == 0.0 ? zeroDemand.get(type)
				: new DefaultLocationEntityDemand(type, demand);
	}

}
